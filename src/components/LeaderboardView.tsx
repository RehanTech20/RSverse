import React from 'react';
import { Award, BookOpen, Brain, Calendar, Crown, Flame, Heart, Trophy } from 'lucide-react';
import type { AchievementItem, PlayerStats, RecentActivityItem } from '../types/rsverse';

interface LeaderboardViewProps {
  currentUserId: string;
  leaderboard: PlayerStats[];
  achievements: AchievementItem[];
  recentMatches: RecentActivityItem[];
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Trophy,
  Crown,
  BookOpen,
  Heart,
  Flame,
  Brain,
  Calendar,
};

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  currentUserId,
  leaderboard,
  achievements,
  recentMatches,
}) => {
  return (
    <div className="space-y-8 pb-20 md:pb-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
          Leaderboard & Achievements
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Every match, streak, and unlocked milestone computed live from your shared game history.
        </p>
      </div>

      {/* Player Comparison Table */}
      <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10">
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Shared Standings
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400">
                <th className="py-3 px-6 font-medium">Player</th>
                <th className="py-3 px-4 font-medium text-right">Matches</th>
                <th className="py-3 px-4 font-medium text-right">Wins</th>
                <th className="py-3 px-4 font-medium text-right">Losses</th>
                <th className="py-3 px-4 font-medium text-right">Draws</th>
                <th className="py-3 px-4 font-medium text-right">Win %</th>
                <th className="py-3 px-4 font-medium text-right">Best Streak</th>
                <th className="py-3 px-4 font-medium">Favorite Game</th>
                <th className="py-3 px-6 font-medium text-right">Total Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
              {leaderboard.map((player, idx) => (
                <tr key={player.userId} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <span className="font-mono-tabular text-xs font-bold text-slate-400 w-4">
                        #{idx + 1}
                      </span>
                      <img
                        src={player.avatarUrl}
                        alt={player.username}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {player.username} {player.userId === currentUserId ? '(You)' : ''}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {player.isOnline ? 'Online' : 'Offline'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right font-mono-tabular">{player.totalMatches}</td>
                  <td className="py-4 px-4 text-right font-mono-tabular text-emerald-600 dark:text-emerald-400 font-semibold">
                    {player.wins}
                  </td>
                  <td className="py-4 px-4 text-right font-mono-tabular text-slate-600 dark:text-slate-400">
                    {player.losses}
                  </td>
                  <td className="py-4 px-4 text-right font-mono-tabular text-slate-600 dark:text-slate-400">
                    {player.draws}
                  </td>
                  <td className="py-4 px-4 text-right font-mono-tabular">{player.winPercentage}%</td>
                  <td className="py-4 px-4 text-right font-mono-tabular">{player.highestStreak}</td>
                  <td className="py-4 px-4 text-slate-700 dark:text-slate-300">
                    {player.favoriteGame || '—'}
                  </td>
                  <td className="py-4 px-6 text-right font-mono-tabular font-bold text-rose-500">
                    {player.totalPoints}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Achievements Grid */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          Achievements
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => {
            const Icon = ICONS[ach.icon] || Award;
            const unlockedByMe = ach.unlockedByUserIds.includes(currentUserId);
            return (
              <div
                key={ach.id}
                className={`rounded-2xl border p-5 flex items-start gap-4 transition ${
                  unlockedByMe
                    ? 'border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/5'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] opacity-75'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    unlockedByMe
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display font-bold text-slate-900 dark:text-white truncate">
                      {ach.title}
                    </h3>
                    <span className="font-mono-tabular text-xs font-semibold text-amber-500 shrink-0">
                      +{ach.points}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ach.description}
                  </p>
                  <div className="text-[11px] font-medium pt-1 text-slate-500 dark:text-slate-400">
                    {unlockedByMe
                      ? `Unlocked ${new Date(ach.unlockedAtMap[currentUserId]).toLocaleDateString()}`
                      : 'Locked'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Match History */}
      <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          Match History
        </h2>
        {recentMatches.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No completed matches recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {recentMatches.map((m) => (
              <div key={m.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="font-medium text-slate-900 dark:text-white">{m.summary}</span>
                <span className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                  {new Date(m.endedAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
