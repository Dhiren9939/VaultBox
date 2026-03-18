import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  User,
  ShieldEllipsis,
  Loader2,
} from 'lucide-react';
import {
  getMyTrustees,
  getMyTrustors,
  revokeTrustee,
} from '../service/api';

const RecoveryTab = ({ user }) => {
  const [trustees, setTrustees] = useState([]);
  const [trustors, setTrustors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [trusteesData, trustorsData] = await Promise.all([
        getMyTrustees(),
        getMyTrustors(),
      ]);
      setTrustees(trusteesData || []);
      setTrustors(trustorsData || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch recovery data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRevoke = async (shardId) => {
    if (
      !window.confirm(
        'Are you sure you want to revoke this trustee? They will no longer be able to help you recover your vault.'
      )
    )
      return;
    try {
      await revokeTrustee(shardId);
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to revoke trustee.');
    }
  };

  // Threshold for Shamir's Secret Sharing in this implementation (f(x) = a2*x^2 + a1*x + a0)
  const THRESHOLD = 3;
  const acceptedCount = trustees.filter((t) => t.status === 'accepted').length;
  const progressPercent = Math.min((acceptedCount / THRESHOLD) * 100, 100);
  const isProtected = acceptedCount >= THRESHOLD;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Recovery Center
          </h1>
          <p className="text-gray-400">
            Monitor your distributed backup shards and protection status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            title="Refresh"
            disabled={isLoading}
            className="p-3 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Protection Status Card */}
      <div className="bg-gray-950/50 border border-gray-900 rounded-2xl p-6 backdrop-blur-sm overflow-hidden relative group">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-700" />
        <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
            isProtected 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-lg shadow-emerald-500/10' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-500'
          }`}>
            {isProtected ? <ShieldCheck size={40} /> : <ShieldEllipsis size={40} />}
          </div>
          <div className="flex-1 w-full space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-lg font-bold text-white">
                  Vault Protection: {isProtected ? 'Optimal' : 'Insufficient'}
                </h3>
                <p className="text-sm text-gray-400">
                  {isProtected 
                    ? 'You have enough trustees to recover your vault in case of emergency.' 
                    : `You need ${THRESHOLD - acceptedCount} more accepted shards to ensure full recovery.`}
                </p>
              </div>
              <span className="text-xs font-black tracking-widest text-gray-500 uppercase">
                {acceptedCount} / {THRESHOLD} Shards
              </span>
            </div>
            <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out-expo ${
                  isProtected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
          <ShieldAlert size={18} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trusted By Me (People who have my shards) */}
        <section className="bg-gray-950/50 border border-gray-900 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="px-6 py-5 border-b border-gray-900 bg-gray-900/20 flex justify-between items-center">
            <h2 className="font-bold flex items-center gap-2.5">
              <ShieldCheck className="text-emerald-500 w-5 h-5" /> Who has my shards
            </h2>
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold bg-gray-900 px-2.5 py-1 rounded-full border border-gray-800">
              {trustees.length} Total
            </span>
          </div>
          <div className="p-1 min-h-[300px]">
            {isLoading && trustees.length === 0 ? (
               <div className="flex items-center justify-center py-20 text-gray-600">
                  <Loader2 className="w-8 h-8 animate-spin" />
               </div>
            ) : trustees.length === 0 ? (
              <div className="text-center py-20 text-gray-600">
                <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p className="text-sm px-10">No recovery trustees found. Go to Dead Drops to invite someone.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-900">
                {trustees.map((t) => (
                  <div
                    key={t._id}
                   className="flex items-center justify-between p-5 hover:bg-white/2 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Consistent Avatar with Dead Drops */}
                      <div className="w-9 h-9 rounded-full bg-linear-to-br from-violet-600 to-blue-500 flex items-center justify-center shrink-0 border border-white/5 shadow-lg">
                        <User size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-100">
                          {t.holder?.firstName} {t.holder?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] sm:max-w-none">
                          {t.holder?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {t.status === 'pending' ? (
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                          <Clock size={12} /> Pending
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <CheckCircle2 size={12} /> Accepted
                        </div>
                      )}

                      <button
                        onClick={() => handleRevoke(t._id)}
                        className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Revoke Shard"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* I am a Trusted Trustee (Whose shards I have) */}
        <section className="bg-gray-950/50 border border-gray-900 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="px-6 py-5 border-b border-gray-900 bg-gray-900/20 flex justify-between items-center">
            <h2 className="font-bold flex items-center gap-2.5">
              <KeyRound className="text-blue-500 w-5 h-5" /> Whose shards I have
            </h2>
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold bg-gray-900 px-2.5 py-1 rounded-full border border-gray-800">
              {trustors.length} Trustors
            </span>
          </div>
          <div className="p-1 min-h-[300px]">
            {isLoading && trustors.length === 0 ? (
               <div className="flex items-center justify-center py-20 text-gray-600">
                  <Loader2 className="w-8 h-8 animate-spin" />
               </div>
            ) : trustors.length === 0 ? (
              <div className="text-center py-20 text-gray-600">
                <KeyRound className="w-12 h-12 mx-auto mb-4 opacity-10" />
                <p className="text-sm px-10">You aren&apos;t holding shards for anyone yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-900">
                {trustors.map((t) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between p-5 hover:bg-white/2 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Consistent Avatar with Dead Drops */}
                      <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-600 to-indigo-500 flex items-center justify-center shrink-0 border border-white/5 shadow-lg">
                        <User size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-100">
                          {t.owner?.firstName} {t.owner?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] sm:max-w-none">
                          {t.owner?.email}
                        </p>
                      </div>
                    </div>
                    <div>
                      {t.recoveryRequested ? (
                        <div className="flex items-center gap-2 text-[10px] uppercase font-black text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/30 shadow-[0_0_15px_-5px_rgba(239,68,68,0.5)] animate-pulse">
                          RECOVERY REQUESTED
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-500 bg-gray-800/50 px-2.5 py-1 rounded-full border border-gray-700">
                          Active
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

RecoveryTab.propTypes = {
  user: PropTypes.object,
};

export default RecoveryTab;
