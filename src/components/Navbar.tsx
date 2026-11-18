import React from 'react';
import type { Room, UserProfile } from '../types/rsverse';

export type NavTab = 'dashboard' | 'games' | 'room' | 'memories' | 'leaderboard' | 'chat' | 'settings';

interface NavbarProps {
  activeTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  user: UserProfile;
  activeRoom: Room | null;
  unreadChatCount: number;
  unreadNotifCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onNavigate,
  user,
  activeRoom,
  unreadChatCount,
  unreadNotifCount,
}) => {
  const navItems: Array<{ id: NavTab; label: string; suffix?: string }> = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'games', label: 'Games' },
    { id: 'memories', label: 'Memories' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'chat', label: 'Chat', suffix: unreadChatCount > 0 ? `(${unreadChatCount})` : undefined },
  ];

  return (
    <>
      {/* Desktop & Tablet Top Bar (Strict 3-Zone Contract) */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-white/10 bg-[#F8F7FC]/90 dark:bg-[#0A0714]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="font-display text-xl font-bold tracking-tight whitespace-nowrap shrink-0 bg-gradient-to-r from-rose-500 via-violet-500 to-blue-500 bg-clip-text text-transparent cursor-pointer"
          >
            RSverse
          </button>

          {/* Zone 2: Clean single-line text nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'border-rose-500 text-slate-900 dark:text-white font-semibold'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                  {item.suffix && <span className="ml-1 font-mono-tabular text-rose-500">{item.suffix}</span>}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'border-rose-500 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {user.username}
              {unreadNotifCount > 0 && (
                <span className="ml-1 font-mono-tabular text-violet-500">· {unreadNotifCount}</span>
              )}
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('room')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 text-white text-xs sm:text-sm font-semibold shadow-sm hover:opacity-95 transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              {activeRoom ? `Room · ${activeRoom.inviteCode}` : 'Play Together'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav (Compact, <= 15% viewport height) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0E0A1B]/95 backdrop-blur-xl px-2 py-2 flex items-center justify-around">
        {[
          { id: 'dashboard' as NavTab, label: 'Home' },
          { id: 'games' as NavTab, label: 'Games' },
          { id: 'room' as NavTab, label: activeRoom ? 'Room' : 'Play' },
          { id: 'chat' as NavTab, label: unreadChatCount > 0 ? `Chat (${unreadChatCount})` : 'Chat' },
          { id: 'memories' as NavTab, label: 'Memories' },
          { id: 'settings' as NavTab, label: 'Settings' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`px-2.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === item.id
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </>
  );
};
