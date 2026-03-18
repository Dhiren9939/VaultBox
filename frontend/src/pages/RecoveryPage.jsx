import React, { useState, useEffect } from 'react';
import { Mail, Lock, KeyRound, Loader2, ArrowRight, ShieldCheck, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { startRecovery, getRecoveryShards, finalizeRecovery, cancelRecovery } from '../service/api';
import {
  generateRSAKeyPair,
  generateFAttributes,
  generateKEK,
  base64ToBuffer,
  bufferToBase64,
  decryptDEK,
  encryptDEK,
  decryptEphemeralPrivateKey,
  decryptShardWithRSA,
  reconstructRKEK,
} from '../service/cryptoService';

const RecoveryPage = () => {
  const [step, setStep] = useState('START'); // START, WAITING, FINALIZE, SUCCESS
  const [email, setEmail] = useState('');
  const [intermediatePassword, setIntermediatePassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryId, setRecoveryId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [recoveryData, setRecoveryData] = useState(null); // shards, keys, etc.
  
  // For polling
  const [pollInterval, setPollInterval] = useState(null);

  const toUserFacingError = (err, fallback) => {
    const message = err?.response?.data?.message || err?.message || '';
    if (message.includes('Insufficient shards for recovery')) {
      return 'Recovery is not available yet. You need at least 3 accepted trustees before starting recovery.';
    }
    return message || fallback;
  };

  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollInterval]);

  const handleStartRecovery = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Generate Ephemeral RSA Keypair
      // We derive a temporary KEK from the intermediate password to encrypt the RSA private key
      const tempSalt = window.crypto.getRandomValues(new Uint8Array(32));
      const tempKek = await generateKEK(intermediatePassword, tempSalt);
      const keypair = await generateRSAKeyPair(tempKek);

      // 2. Start recovery on backend
      const res = await startRecovery({
        email,
        intermediatePassword,
        ephemeralPublicKey: keypair.publicKey,
        encryptedEphemeralPrivateKey: keypair.encryptedPrivateKey,
        ephemeralIv: keypair.rsaIv,
        ephemeralSalt: bufferToBase64(tempSalt),
      });

      setRecoveryId(res.recoveryId);
      setStep('WAITING');
      startPolling(res.recoveryId);
    } catch (err) {
      setError(toUserFacingError(err, 'Failed to start recovery.'));
    } finally {
      setIsLoading(false);
    }
  };

  const startPolling = (rid) => {
    const interval = setInterval(async () => {
      try {
        const data = await getRecoveryShards(rid);
        setRecoveryData(data);
        // data.shards.length >= 3 is our minimum threshold
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);
    setPollInterval(interval);
  };

  const handlePullShards = async () => {
    if (!recoveryData || recoveryData.shards.length < 3) {
      setError('Need at least 3 shards to proceed.');
      return;
    }
    setError('');
    setStep('FINALIZE');
    if (pollInterval) clearInterval(pollInterval);
  };

  const handleCancelSession = async () => {
    if (!recoveryId) {
      setStep('START');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await cancelRecovery({
        recoveryId,
        intermediatePassword,
      });
      if (pollInterval) clearInterval(pollInterval);
      setPollInterval(null);
      setRecoveryData(null);
      setRecoveryId(null);
      setStep('START');
    } catch (err) {
      setError(
        toUserFacingError(err, 'Failed to cancel recovery session.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const {
        encryptedEphemeralPrivateKey,
        ephemeralIv,
        ephemeralSalt,
        shards,
        reDEK: oldREDEK,
        rIv: oldRIv,
      } = recoveryData;

      // 1. Decrypt RSA Private Key
      const rsaPrivKeyBuffer = await decryptEphemeralPrivateKey(
        encryptedEphemeralPrivateKey,
        intermediatePassword,
        ephemeralSalt,
        ephemeralIv
      );

      // 2. Decrypt all shards with RSA and map to points
      const points = await Promise.all(
        shards.map(async (s) => {
          const raw = await decryptShardWithRSA(rsaPrivKeyBuffer, s.encryptedShardStr);
          // raw is "y1:base64:y2:base64:y3:base64" (wait, dashboard did points.join(':'))
          const yValues = raw.split(':').map(base64Str => {
            const buf = base64ToBuffer(base64Str);
            // Convert buffer to BigInt
            let hex = '';
            buf.forEach(b => hex += b.toString(16).padStart(2, '0'));
            return BigInt('0x' + hex);
          });
          const xVal = BigInt('0x' + (s.contributorId?._id || s.contributorId));
          return { x: xVal, y: yValues };
        })
      );

      // 3. Reconstruct RKEK (Lagrange)
      const RKEK = await reconstructRKEK(points);
      
      // 4. Decrypt old DEK using reconstructed RKEK
      const dekBuf = await decryptDEK(
        RKEK,
        base64ToBuffer(oldREDEK),
        base64ToBuffer(oldRIv)
      );
      
      // 5. Generate NEW master keys from newPassword
      // Full rotation: KEK-side + RKEK-side + user RSA + recovery attributes.
      const kSalt = window.crypto.getRandomValues(new Uint8Array(32));
      const rSalt = window.crypto.getRandomValues(new Uint8Array(32));
      const newKEK = await generateKEK(newPassword, kSalt);
      const newRKEK = await generateKEK(newPassword, rSalt);
      const newFAttributes = generateFAttributes();
      const newRsaKeys = await generateRSAKeyPair(newKEK);

      // Encrypt recovered DEK with new KEK and new RKEK
      const { eDEK: newEDEK, iv: newKIv } = await encryptDEK(newKEK, dekBuf);
      const { eDEK: newREDEK, iv: newRIv } = await encryptDEK(newRKEK, dekBuf);
      
      // 6. Complete recovery session
      await finalizeRecovery({
        recoveryId,
        intermediatePassword,
        newPassword,
        newEDEK: bufferToBase64(newEDEK),
        newREDEK: bufferToBase64(newREDEK),
        kSalt: bufferToBase64(kSalt),
        rSalt: bufferToBase64(rSalt),
        kIv: bufferToBase64(newKIv),
        rIv: bufferToBase64(newRIv),
        publicKey: newRsaKeys.publicKey,
        encryptedPrivateKey: newRsaKeys.encryptedPrivateKey,
        rsaIv: newRsaKeys.rsaIv,
        fAttributes: newFAttributes,
      });

      setStep('SUCCESS');
    } catch (err) {
      console.error('Finalize error:', err);
      setError(toUserFacingError(err, 'Recovery failed during finalization.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-gray-900 via-black to-black">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tighter hover:text-gray-300 transition-colors mb-6">
            <ShieldCheck className="w-8 h-8" /> VaultBox
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Vault Recovery</h1>
          <p className="text-gray-400 mt-2">Recover access to your vault using trusted guardians.</p>
        </div>

        {/* Card */}
        <div className="bg-gray-950/50 backdrop-blur-xl border border-gray-900 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Progress bar or steps here could be cool */}
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {step === 'START' && (
            <form onSubmit={handleStartRecovery} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Account Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-white/20 transition-all text-white placeholder-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Intermediate Password</label>
                <p className="text-xs text-gray-500 mb-2">This password secures your recovery session. You&apos;ll need it to finalize the process later.</p>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                  <input 
                    type="password" 
                    required
                    value={intermediatePassword}
                    onChange={(e) => setIntermediatePassword(e.target.value)}
                    placeholder="Create a temporary password"
                    className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-white/20 transition-all text-white placeholder-gray-700"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <>Start Recovery Flow <ArrowRight size={20} /></>}
              </button>
            </form>
          )}

          {step === 'WAITING' && (
            <div className="text-center space-y-8 py-4">
              <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-6 relative">
                 <div className="absolute inset-0 rounded-3xl border-2 border-white/20 animate-ping-slow"></div>
                 <UserCheck size={40} className="text-white" />
              </div>
              
              <div>
                <h2 className="text-xl font-bold">Waiting for Guardians</h2>
                <p className="text-gray-400 mt-2 text-sm italic">Session ID: {recoveryId}</p>
                <p className="text-gray-500 mt-4 text-sm max-w-xs mx-auto">
                  At least 3 trustees must approve your request before you can reconstruct your keys.
                </p>
              </div>

              {/* Contributor List */}
              <div className="bg-black/40 rounded-xl border border-gray-900 p-4 space-y-3">
                <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider px-2">
                  <span>Guardians</span>
                  <span>Status</span>
                </div>
                {(!recoveryData || !recoveryData.shards || recoveryData.shards.length === 0) ? (
                    <div className="py-4 text-gray-600 text-sm">No shards received yet...</div>
                ) : (
                  recoveryData.shards.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="flex items-center gap-3">
                         {(() => {
                           const contributor = s.contributorId || {};
                           const fullName = `${contributor.firstName || ''} ${contributor.lastName || ''}`.trim();
                           const fallbackId = String(contributor._id || contributor || '').slice(-4);
                           return (
                             <>
                               <div className="w-8 h-8 rounded-full bg-linear-to-br from-gray-700 to-gray-900 flex items-center justify-center text-[10px] font-bold">
                                  {i + 1}
                               </div>
                               <span className="text-sm font-medium">
                                 {fullName || `User ...${fallbackId}`}
                               </span>
                             </>
                           );
                         })()}
                      </div>
                      <CheckCircle2 size={16} className="text-green-500" />
                    </div>
                  ))
                )}
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button 
                  onClick={handlePullShards}
                  disabled={!recoveryData || recoveryData.shards.length < 3}
                  className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  Finalize and Decrypt Shards
                </button>
                <button
                  onClick={handleCancelSession}
                  disabled={isLoading}
                  className="text-gray-500 hover:text-white text-sm transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Cancelling...' : 'Cancel Session'}
                </button>
              </div>
            </div>
          )}

          {step === 'FINALIZE' && (
            <form onSubmit={handleFinalize} className="space-y-6">
               <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <KeyRound size={28} className="text-white" />
              </div>
              <div className="text-center mb-8">
                 <h2 className="text-xl font-bold">Set New Credentials</h2>
                 <p className="text-gray-500 text-sm mt-1">Reconstruction ready. Create your new master password.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">New Master Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                  <input 
                    type="password" 
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-white/20 transition-all text-white placeholder-gray-700"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <>Finalize Recovery & Reset Vault</>}
              </button>
            </form>
          )}

          {step === 'SUCCESS' && (
            <div className="text-center py-8 animate-in zoom-in-95 duration-500">
               <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-success-scale">
                    <CheckCircle2 size={36} className="text-black" />
                  </div>
               </div>
               <h2 className="text-2xl font-bold mb-4">Recovery Successful!</h2>
               <p className="text-gray-400 mb-10 max-w-xs mx-auto">Your vault has been reset with your new password. You can now login normally.</p>
               <Link 
                to="/login"
                className="block w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98] text-center"
               >
                 Back to Login
               </Link>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center text-gray-600 text-xs">
          <p>VaultBox uses Shamir&apos;s Secret Sharing (SSS) to recover your private keys without central authority.</p>
        </div>
      </div>

      <style>{`
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes success-scale {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-success-scale {
          animation: success-scale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default RecoveryPage;
