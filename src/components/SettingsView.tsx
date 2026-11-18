import React, { useState } from 'react';
import { Bell, Database, KeyRound, LogOut, Moon, Music, ShieldCheck, Sun, Upload, Volume2 } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { compressImageFile } from '../lib/imageCompress';
import { isSupabaseConfigured } from '../lib/supabase';
import type { NotificationItem, ThemeMode, UserProfile } from '../types/rsverse';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  user: UserProfile;
  authorizedUsers: Array<{ id: string; email: string; role: string; created_at: string }>;
  notifications: NotificationItem[];
  onUpdateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  onUploadAvatar: (payload: { imageData?: string; presetUrl?: string }) => Promise<void>;
  onAuthorizePartner: (email: string) => Promise<void>;
  onMarkNotificationsRead: () => Promise<void>;
  onLogout: () => Promise<void>;
}

const PRESET_AVATARS = [
  '/src/assets/images/avatar_player_one_1795022088289.jpg',
  '/src/assets/images/avatar_player_two_1795022089302.jpg',
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  authorizedUsers,
  notifications,
  onUpdateProfile,
  onUploadAvatar,
  onAuthorizePartner,
  onMarkNotificationsRead,
  onLogout,
}) => {
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await onUpdateProfile({ username, bio });
      setFeedback('Profile saved.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setFeedback(null);
    try {
      const compressed = await compressImageFile(file, 512, 0.85);
      await onUploadAvatar({ imageData: compressed });
      setFeedback('Profile picture updated.');
    } catch (err: any) {
      setError(err.message || 'Could not update profile picture.');
    } finally {
      e.target.value = '';
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    setChangingPassword(true);
    try {
      await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setFeedback('Password updated securely.');
    } catch (err: any) {
      setError(err.message || 'Could not update password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePartnerAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      await onAuthorizePartner(partnerEmail.trim());
      setPartnerEmail('');
      setFeedback('Partner email authorized.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Settings & Preferences
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage your profile, theme, audio, privacy controls, and notifications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PWAInstallButton />
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-300 text-sm font-medium hover:bg-rose-500/10 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">
          {feedback}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 dark:text-rose-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Settings */}
        <section className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-6 space-y-5">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Profile Identity
          </h2>

          <div className="flex flex-wrap items-center gap-4">
            <img
              src={user.avatarUrl}
              alt={user.username}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border border-violet-500/40"
            />
            <div className="space-y-2">
              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Upload Picture
                <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
              </label>
              <div className="flex items-center gap-2">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => onUploadAvatar({ presetUrl: url })}
                    className="text-xs text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                  >
                    Use Avatar {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={24}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Bio / Status Note
              </label>
              <input
                type="text"
                maxLength={180}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short note for your partner"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Account Email: {user.email} · Role: {user.role === 'creator' ? 'Universe Creator' : 'Partner'}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 text-white text-sm font-semibold cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </section>

        {/* Theme, Sound, Music, Notifications */}
        <section className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-6 space-y-5">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Experience Controls
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                {user.themePreference === 'dark' ? <Moon className="w-4 h-4 text-violet-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                Theme Mode
              </div>
              <div className="flex gap-1 p-1 rounded-lg bg-slate-200 dark:bg-white/10">
                {(['dark', 'light'] as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onUpdateProfile({ themePreference: mode })}
                    className={`px-3 py-1 rounded-md text-xs font-semibold capitalize cursor-pointer ${
                      user.themePreference === mode
                        ? 'bg-white dark:bg-[#231B42] text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onUpdateProfile({ soundEnabled: !user.soundEnabled })}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                <Volume2 className="w-4 h-4 text-rose-500" />
                Game Sound Effects
              </span>
              <span className={`text-xs font-semibold ${user.soundEnabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                {user.soundEnabled ? 'Enabled' : 'Muted'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateProfile({ musicEnabled: !user.musicEnabled })}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                <Music className="w-4 h-4 text-violet-500" />
                Ambient Universe Synth
              </span>
              <span className={`text-xs font-semibold ${user.musicEnabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                {user.musicEnabled ? 'Playing' : 'Off'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateProfile({ notificationsEnabled: !user.notificationsEnabled })}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                <Bell className="w-4 h-4 text-blue-500" />
                In-App Notifications
              </span>
              <span className={`text-xs font-semibold ${user.notificationsEnabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                {user.notificationsEnabled ? 'Enabled' : 'Paused'}
              </span>
            </button>
          </div>
        </section>
      </div>

      {/* Privacy & 2-Player Authorization */}
      <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Private 2-Player Access Control
          </h2>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
          {authorizedUsers.map((au) => (
            <div key={au.id} className="font-mono-tabular">
              {au.role.toUpperCase()} · {au.email}
            </div>
          ))}
        </div>

        {authorizedUsers.length < 2 && (
          <form onSubmit={handlePartnerAuth} className="flex flex-col sm:flex-row gap-2 max-w-md pt-2">
            <input
              type="email"
              required
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              placeholder="Pre-authorize partner's email address"
              className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2 text-sm text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold cursor-pointer"
            >
              Authorize
            </button>
          </form>
        )}
      </section>

      {/* Account Password Update */}
      <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-violet-500" />
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Change Password
          </h2>
        </div>
        <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white/10 hover:bg-violet-600 text-white text-sm font-semibold transition cursor-pointer"
          >
            {changingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </section>

      {/* Recent Notifications */}
      <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Notifications
          </h2>
          {notifications.some((n) => !n.isRead) && (
            <button
              type="button"
              onClick={onMarkNotificationsRead}
              className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
            >
              Mark all as read
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {notifications.map((n) => (
              <div key={n.id} className="py-3 flex items-start justify-between gap-3">
                <div>
                  <div className={`text-sm font-semibold ${n.isRead ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                    {n.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.body}</div>
                </div>
                <span className="text-[11px] font-mono-tabular text-slate-400 shrink-0">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Backend & Supabase Deployment Info */}
      <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-6 space-y-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-violet-500" />
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Backend & Supabase Configuration
          </h2>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Active Runtime: Built-in Express + WebSocket + Relational SQLite server (full real-time multiplayer active).
          External Supabase env vars ({' '}
          <code className="font-mono-tabular">VITE_SUPABASE_URL</code>,{' '}
          <code className="font-mono-tabular">VITE_SUPABASE_ANON_KEY</code> ):{' '}
          <strong>{isSupabaseConfigured ? 'Configured' : 'Not set (schema ready in supabase/schema.sql)'}</strong>.
        </p>
      </section>
    </div>
  );
};
