import React, { useState } from "react";
import {
  Lock,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

const MasterPasswordEntry = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const handleUnlock = (e) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center p-6">
      {/* Background Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Logo / Branding */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
            <Lock className="text-black w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter">
            Unlock Your Vault
          </h1>
          <p className="text-gray-500 mt-2 text-center">
            Your data is encrypted locally. Enter your master password to
            decrypt.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleUnlock} className="space-y-6">
          <div className="relative group">
            <input
              autoFocus
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Master Password"
              className="w-full bg-gray-950 border-2 border-gray-900 rounded-xl py-5 px-6 pr-14 text-xl outline-none focus:border-white transition-all placeholder:text-gray-700"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          </div>

          <button
            disabled={!password || isDecrypting}
            className={`w-full py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
              isDecrypting
                ? "bg-gray-800 text-gray-400 cursor-not-allowed"
                : "bg-white text-black hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            }`}
          >
            {isDecrypting ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                Decrypting Vault...
              </>
            ) : (
              <>
                Unlock Vault <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        {/* Footer / Helper Info */}
        <div className="mt-12 p-6 border border-gray-900 bg-gray-950/50 rounded-2xl">
          <div className="flex gap-4">
            <div className="mt-1">
              <ShieldCheck className="text-gray-400 w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-300">
                Forgot your password?
              </h4>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                VaultBox doesn't store your password. If you're locked out, use
                your
                <button className="text-white hover:underline ml-1">
                  Social Recovery
                </button>{" "}
                helpers to regain access.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-xs font-medium text-gray-600 uppercase tracking-widest">
          <span className="flex items-center gap-2">
            <AlertCircle size={14} /> AES-256 Bit
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck size={14} /> Zero Knowledge
          </span>
        </div>
      </div>
    </div>
  );
};

export default MasterPasswordEntry;
