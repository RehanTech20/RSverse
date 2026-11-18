import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Eye, EyeOff, Heart, KeyRound, Lock, Moon, Sun, UserPlus } from 'lucide-react';
import { apiRequest, setAuthToken } from '../lib/api';
import type { ThemeMode, UniverseStatus, UserProfile } from '../types/rsverse';
import { PWAInstallButton } from './PWAInstallButton';

interface LandingAuthProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  onAuthenticated: (user: UserProfile) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

export const LandingAuth: React.FC<LandingAuthProps> = ({
  theme,
  onToggleTheme,
  onAuthenticated,
}) => {
  const [universe, setUniverse] = useState<UniverseStatus | null>(null);
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetRequested, setResetRequested] = useState(false);
  const [issuedRecoveryCode, setIssuedRecoveryCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<UniverseStatus>('/api/auth/status')
      .then((status) => {
        setUniverse(status);
        if (status.registeredCount < 2) {
          setMode('signup');
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const res = await apiRequest<{ token: string; user: UserProfile }>('/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ email, username, password }),
        });
        setAuthToken(res.token);
        onAuthenticated(res.user);
      } else if (mode === 'login') {
        const res = await apiRequest<{ token: string; user: UserProfile }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setAuthToken(res.token);
        onAuthenticated(res.user);
      } else if (mode === 'forgot') {
        if (!resetRequested) {
          const res = await apiRequest<{ message: string; recoveryCode?: string }>('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
          });
          setResetRequested(true);
          setIssuedRecoveryCode(res.recoveryCode || null);
          setSuccessMsg(res.message);
        } else {
          await apiRequest('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, code: resetCode, newPassword }),
          });
          setResetRequested(false);
          setIssuedRecoveryCode(null);
          setResetCode('');
          setNewPassword('');
          setMode('login');
          setSuccessMsg('Password updated. Sign in with your new password.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7FC] text-[#141024] dark:bg-[#0A0714] dark:text-[#F4F1FF] transition-colors">
      {/* Subtle Ambient Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-8">
        <span className="font-display text-xl font-bold tracking-tight whitespace-nowrap shrink-0 bg-gradient-to-r from-rose-500 via-violet-500 to-blue-500 bg-clip-text text-transparent">
          RSverse
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <PWAInstallButton compact />
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-violet-700" />}
          </button>
        </div>
      </header>

      {/* Main Split Hero + Auth */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Visual Story */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="lg:col-span-7 relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-[#130F24] flex flex-col justify-between min-h-[420px] lg:min-h-[560px]"
        >
          <img
            src="/src/assets/images/hero_universe_backdrop_1795022088713.jpg"
            alt="RSverse deep twilight cosmos"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0714] via-[#0A0714]/65 to-[#0A0714]/30" />

          <div className="relative z-10 p-8 sm:p-10 flex items-center justify-between text-xs text-slate-300">
            <span className="font-medium tracking-wide">Private Two-Player Sanctuary</span>
            <span className="font-mono-tabular text-slate-300">
              {universe ? `${universe.registeredCount} / ${universe.maxUsers} Players Registered` : 'Checking slots...'}
            </span>
          </div>

          <div className="relative z-10 p-8 sm:p-10 space-y-6">
            <div className="space-y-3 max-w-xl">
              <p className="text-sm font-medium text-rose-300 flex items-center gap-2">
                <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />
                Two Players. One Universe. Infinite Memories.
              </p>
              <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white text-balance leading-[1.12]">
                A private gaming universe built exclusively for the two of you.
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
                Connect across devices in real time to play nine synchronized multiplayer games, draw on a shared canvas, message privately, and preserve your favorite moments together.
              </p>
            </div>

            {universe && universe.profiles.length > 0 && (
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-6">
                {universe.profiles.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <img
                      src={p.avatarUrl}
                      alt={p.username}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-white/20"
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-white">{p.username}</div>
                      <div className="text-slate-400">
                        {p.role === 'creator' ? 'Player 1' : 'Player 2'} · {p.isOnline ? 'Online' : 'Offline'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>

        {/* Right Auth Card */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24]/90 backdrop-blur-xl p-7 sm:p-9 flex flex-col justify-center"
        >
          {/* Mode Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition cursor-pointer whitespace-nowrap ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#231B42] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              disabled={universe?.isLocked}
              onClick={() => { setMode('signup'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                universe?.isLocked
                  ? 'opacity-45 cursor-not-allowed text-slate-400'
                  : mode === 'signup'
                  ? 'bg-white dark:bg-[#231B42] text-slate-900 dark:text-white shadow-sm cursor-pointer'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer'
              }`}
            >
              {universe?.isLocked ? 'Universe Full (2/2)' : 'Create Account'}
            </button>
          </div>

          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {mode === 'login' && 'Enter Your Universe'}
              {mode === 'signup' && (universe?.registeredCount === 0 ? 'Claim Player 1 Seat' : 'Claim Player 2 Seat')}
              {mode === 'forgot' && 'Recover Access'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {mode === 'login' && 'Sign in to sync rooms, games, and private chat.'}
              {mode === 'signup' && 'Only two authorized accounts can ever belong to RSverse.'}
              {mode === 'forgot' && 'Generate a 6-digit recovery code to reset your password.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">
              {successMsg}
              {issuedRecoveryCode && (
                <div className="mt-2 font-mono-tabular font-semibold text-base">
                  Recovery Code: {issuedRecoveryCode}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Player Username
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={24}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a display name"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            )}

            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 pr-11 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'forgot' && resetRequested && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    6-Digit Recovery Code
                  </label>
                  <input
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm font-mono-tabular text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-rose-500 via-violet-600 to-blue-600 py-3 px-5 text-sm font-semibold text-white shadow-md hover:opacity-95 disabled:opacity-60 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {mode === 'login' && (
                <>
                  <Lock className="w-4 h-4" />
                  {loading ? 'Signing in...' : 'Sign In'}
                </>
              )}
              {mode === 'signup' && (
                <>
                  <UserPlus className="w-4 h-4" />
                  {loading ? 'Creating profile...' : 'Join RSverse'}
                </>
              )}
              {mode === 'forgot' && (
                <>
                  <KeyRound className="w-4 h-4" />
                  {loading ? 'Processing...' : resetRequested ? 'Update Password' : 'Generate Recovery Code'}
                </>
              )}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            {mode !== 'forgot' ? (
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(null); setSuccessMsg(null); setIssuedRecoveryCode(null); setResetRequested(false); }}
                className="hover:text-slate-900 dark:hover:text-white underline-offset-4 hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); setIssuedRecoveryCode(null); setResetRequested(false); }}
                className="hover:text-slate-900 dark:hover:text-white underline-offset-4 hover:underline cursor-pointer"
              >
                Back to sign in
              </button>
            )}
            <span>Private 2-Player Access</span>
          </div>
        </motion.section>
      </main>
    </div>
  );
};
