import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, DoorOpen, PlusSquare } from 'lucide-react';
import type { GameCatalogItem, GameId } from '../types/rsverse';

interface GamesLibraryViewProps {
  games: GameCatalogItem[];
  onCreateRoomWithGame: (gameId: GameId) => void;
  onOpenJoinModal: () => void;
}

const CATEGORIES = ['All', 'Classic', 'Strategy', 'Party', 'Creative', 'Word'] as const;

export const GamesLibraryView: React.FC<GamesLibraryViewProps> = ({
  games,
  onCreateRoomWithGame,
  onOpenJoinModal,
}) => {
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>('All');

  const visibleGames = games.filter((g) => filter === 'All' || g.category === filter);

  return (
    <div className="space-y-6 pb-20 md:pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Nine Worlds to Play Together
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Select any game to open a synchronized multiplayer room, or enter an invitation code from your partner.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenJoinModal}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#130F24] px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition whitespace-nowrap shrink-0 cursor-pointer"
        >
          <DoorOpen className="w-4 h-4" />
          Join with Code
        </button>
      </div>

      {/* Interactive Filter Segmented Bar */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 w-fit max-w-full overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap shrink-0 cursor-pointer ${
              filter === cat
                ? 'bg-white dark:bg-[#231B42] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 9-Game Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleGames.map((game, index) => (
          <motion.article
            key={game.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-6 flex flex-col justify-between gap-5 hover:border-violet-500/40 transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{game.category} · 2 Players</span>
                <span className="font-mono-tabular">{game.estimatedMinutes}</span>
              </div>
              <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                {game.name}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {game.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onCreateRoomWithGame(game.id)}
              className="w-full inline-flex items-center justify-between rounded-xl bg-slate-900 dark:bg-white/10 hover:bg-gradient-to-r hover:from-rose-500 hover:to-violet-600 px-4 py-3 text-sm font-semibold text-white transition cursor-pointer"
            >
              <span className="inline-flex items-center gap-2">
                <PlusSquare className="w-4 h-4" />
                Create Room
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.article>
        ))}
      </div>
    </div>
  );
};
