import React from 'react';
import { motion } from 'motion/react';
import {
  Camera,
  DoorOpen,
  Gamepad2,
  Heart,
  PlusSquare,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import type {
  GameCatalogItem,
  GameId,
  PlayerStats,
  RecentActivityItem,
  Room,
  UserProfile,
} from '../types/rsverse';
import type { NavTab } from './Navbar';

interface DashboardViewProps {
  user: UserProfile;
  partner: UserProfile | null;
  myStats: PlayerStats | null;
  partnerStats: PlayerStats | null;
  recentActivities: RecentActivityItem[];
  games: GameCatalogItem[];
  activeRoom: Room | null;
  wsConnected: boolean;
  onNavigate: (tab: NavTab) => void;
  onQuickCreateRoom: (gameId?: GameId) => void;
  onOpenJoinModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  partner,
  myStats,
  partnerStats,
  recentActivities,
  games,
  activeRoom,
  wsConnected,
  onNavigate,
  onQuickCreateRoom,
  onOpenJoinModal,
}) => {
  return (
    <div className="space-y-8 pb-20 md:pb-10">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 bg-[#130F24]"
      >
        <img
          src="/src/assets/images/hero_universe_backdrop_1795022088713.jpg"
          alt="RSverse twilight cosmos"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0714]/95 via-[#0A0714]/80 to-[#0A0714]/45" />

        <div className="relative z-10 p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="text-xs sm:text-sm text-rose-300 font-medium flex items-center gap-2">
              <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />
              <span>Two Players. One Universe. Infinite Memories.</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight text-balance">
              Welcome back, {user.username}.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              {partner
                ? `${partner.username} is currently ${partner.isOnline ? 'online and ready in your universe' : 'offline'}. Launch a synchronized room or share a moment together.`
                : 'Your Player 2 seat is open. Share this URL with your partner so they can create their private account and join you.'}
            </p>

            {/* 5 Requested Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => (activeRoom ? onNavigate('room') : onQuickCreateRoom('tic-tac-toe'))}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:opacity-95 transition whitespace-nowrap cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                {activeRoom ? `Resume Room (${activeRoom.inviteCode})` : 'Play Together'}
              </button>

              <button
                type="button"
                onClick={() => onQuickCreateRoom()}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-3 text-sm font-medium text-white transition whitespace-nowrap cursor-pointer"
              >
                <PlusSquare className="w-4 h-4" />
                Create Room
              </button>

              <button
                type="button"
                onClick={onOpenJoinModal}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-3 text-sm font-medium text-white transition whitespace-nowrap cursor-pointer"
              >
                <DoorOpen className="w-4 h-4" />
                Join Room
              </button>

              <button
                type="button"
                onClick={() => onNavigate('games')}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-3 text-sm font-medium text-white transition whitespace-nowrap cursor-pointer"
              >
                <Gamepad2 className="w-4 h-4" />
                View Games
              </button>

              <button
                type="button"
                onClick={() => onNavigate('memories')}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-3 text-sm font-medium text-white transition whitespace-nowrap cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Our Memories
              </button>
            </div>
          </div>

          {/* Live Player Duo Presence Panel */}
          <div className="lg:col-span-5 rounded-2xl border border-white/15 bg-[#120D22]/85 backdrop-blur-md p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-medium">Universe Connection</span>
              <span className="flex items-center gap-1.5 font-mono-tabular">
                <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {wsConnected ? 'Live Sync Active' : 'Reconnecting...'}
              </span>
            </div>

            {/* User Card */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover border border-rose-400/40 shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">{user.username}</div>
                  <div className="text-xs text-slate-400">You · Online</div>
                </div>
              </div>
              <div className="text-right font-mono-tabular text-xs text-slate-300 shrink-0">
                <div className="font-semibold text-white">{myStats?.wins ?? 0} wins</div>
                <div className="text-slate-400">{myStats?.totalPoints ?? 0} pts</div>
              </div>
            </div>

            {/* Partner Card */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
              {partner ? (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={partner.avatarUrl}
                      alt={partner.username}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover border border-blue-400/40 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">{partner.username}</div>
                      <div className="text-xs flex items-center gap-1.5 text-slate-300">
                        <span className={`w-2 h-2 rounded-full ${partner.isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        <span>{partner.isOnline ? 'Online now' : 'Offline'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono-tabular text-xs text-slate-300 shrink-0">
                    <div className="font-semibold text-white">{partnerStats?.wins ?? 0} wins</div>
                    <div className="text-slate-400">{partnerStats?.totalPoints ?? 0} pts</div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 text-xs text-slate-400 py-1">
                  <Users className="w-5 h-5 text-slate-500 shrink-0" />
                  <span>Waiting for your partner to create the 2nd account.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* 4-Column Stat Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Total Games Played</div>
          <div className="mt-2 font-display text-3xl font-bold font-mono-tabular text-slate-900 dark:text-white">
            {myStats?.totalMatches ?? 0}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {myStats?.draws ?? 0} draws · {myStats?.losses ?? 0} losses
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Total Victories</div>
          <div className="mt-2 font-display text-3xl font-bold font-mono-tabular text-rose-600 dark:text-rose-400">
            {myStats?.wins ?? 0}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {myStats?.winPercentage ?? 0}% win rate
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Current Win Streak</div>
          <div className="mt-2 font-display text-3xl font-bold font-mono-tabular text-violet-600 dark:text-violet-400">
            {myStats?.currentStreak ?? 0}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Best streak: {myStats?.highestStreak ?? 0}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Favorite Game</div>
          <div className="mt-2 font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
            {myStats?.favoriteGame || 'None yet'}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
            {myStats?.totalPoints ?? 0} total points
          </div>
        </div>
      </section>

      {/* Quick Launch Games & Recent Activity Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Quick Launch Games
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('games')}
              className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
            >
              Browse all 9 games
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {games.slice(0, 6).map((game) => (
              <button
                key={game.id}
                type="button"
                onClick={() => onQuickCreateRoom(game.id)}
                className="text-left rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] hover:border-violet-500/50 dark:hover:border-violet-400/40 p-5 transition group cursor-pointer"
              >
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  {game.category} · {game.estimatedMinutes}
                </div>
                <div className="font-display text-base font-semibold text-slate-900 dark:text-white group-hover:text-rose-500 dark:group-hover:text-rose-400 transition">
                  {game.name}
                </div>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {game.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Recent Activity
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('leaderboard')}
              className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
            >
              Leaderboard
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] divide-y divide-slate-100 dark:divide-white/5">
            {recentActivities.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <Trophy className="w-7 h-7 text-slate-400 mx-auto" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No completed matches yet</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Create a room and invite your partner to record your first match.
                </p>
              </div>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {act.summary}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {act.gameName} · {new Date(act.endedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
