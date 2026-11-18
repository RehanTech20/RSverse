import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { GameSessionPublic, RoomPlayer } from '../../types/rsverse';

interface GameProps {
  session: GameSessionPublic;
  currentUserId: string;
  players: RoomPlayer[];
  onMove: (moveType: string, payload?: Record<string, unknown>) => Promise<void>;
}

export const MemoryMatchGame: React.FC<GameProps> = ({
  session,
  currentUserId,
  players,
  onMove,
}) => {
  const cards: Array<{
    index: number;
    symbol: string | null;
    isFlipped: boolean;
    isMatched: boolean;
    matchedBy: string | null;
  }> = session.state.cards || [];
  const pairs: Record<string, number> = session.state.pairs || {};
  const moves: Record<string, number> = session.state.moves || {};
  const pairCount = session.state.pairCount || 8;
  const isMyTurn = session.status === 'active' && session.currentTurn === currentUserId && !session.state.mismatchPending;
  const activePlayer = players.find((p) => p.userId === session.currentTurn);

  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    if (session.status !== 'active') {
      if (session.state.elapsedSeconds !== undefined) setElapsedSec(session.state.elapsedSeconds);
      return;
    }
    const start = session.state.startedAtMs || Date.now();
    const id = setInterval(() => {
      setElapsedSec(Math.max(0, Math.round((Date.now() - start) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [session.status, session.state.startedAtMs, session.state.elapsedSeconds]);

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="w-full max-w-lg grid grid-cols-2 gap-3">
        {players.map((p) => (
          <div
            key={p.userId}
            className={`rounded-xl border p-3.5 flex items-center justify-between ${
              session.currentTurn === p.userId && session.status === 'active'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5'
            }`}
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{p.username}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                {moves[p.userId] || 0} moves
              </div>
            </div>
            <div className="text-right font-mono-tabular">
              <div className="text-xl font-bold text-emerald-500">{pairs[p.userId] || 0}</div>
              <div className="text-[11px] text-slate-500">pairs</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
        <span>
          {session.status === 'completed'
            ? session.isDraw
              ? 'Tie game!'
              : `${players.find((p) => p.userId === session.winnerId)?.username} found the most pairs!`
            : session.state.mismatchPending
            ? 'Not a match — flipping back...'
            : isMyTurn
            ? 'Your turn — Flip two cards (match keeps your turn)'
            : `${activePlayer?.username || 'Partner'}'s turn...`}
        </span>
        <span className="font-mono-tabular text-xs text-slate-500">· {elapsedSec}s</span>
      </div>

      <div
        className={`grid gap-2.5 sm:gap-3 w-full ${
          pairCount === 12 ? 'grid-cols-4 sm:grid-cols-6 max-w-xl' : 'grid-cols-4 max-w-md'
        }`}
      >
        {cards.map((card) => {
          const canFlip = isMyTurn && !card.isFlipped && !card.isMatched;
          return (
            <motion.button
              key={card.index}
              type="button"
              whileTap={canFlip ? { scale: 0.94 } : undefined}
              disabled={!canFlip}
              onClick={() => onMove('memory:flip', { index: card.index })}
              className={`aspect-square rounded-2xl border text-2xl sm:text-3xl flex items-center justify-center transition min-h-[64px] ${
                card.isMatched
                  ? 'border-emerald-500/50 bg-emerald-500/15'
                  : card.isFlipped
                  ? 'border-violet-500 bg-violet-500/15'
                  : canFlip
                  ? 'border-slate-200 dark:border-white/15 bg-white dark:bg-[#19142E] hover:border-rose-500 cursor-pointer'
                  : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 cursor-default'
              }`}
            >
              {card.isFlipped || card.isMatched ? (
                <span>{card.symbol}</span>
              ) : (
                <span className="text-sm font-display font-bold text-slate-400 dark:text-slate-600">RS</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
