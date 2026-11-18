import React from 'react';
import { motion } from 'motion/react';
import type { GameSessionPublic, RoomPlayer } from '../../types/rsverse';

interface GameProps {
  session: GameSessionPublic;
  currentUserId: string;
  players: RoomPlayer[];
  onMove: (moveType: string, payload?: Record<string, unknown>) => Promise<void>;
}

export const TicTacToeGame: React.FC<GameProps> = ({
  session,
  currentUserId,
  players,
  onMove,
}) => {
  const board: Array<'X' | 'O' | null> = session.state.board || Array(9).fill(null);
  const marks: Record<string, 'X' | 'O'> = session.state.marks || {};
  const winningLine: number[] | null = session.state.winningLine || null;
  const myMark = marks[currentUserId] || 'X';
  const isMyTurn = session.status === 'active' && session.currentTurn === currentUserId;
  const activePlayer = players.find((p) => p.userId === session.currentTurn);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
        {players.map((p) => (
          <div
            key={p.userId}
            className={`px-4 py-2 rounded-xl border transition ${
              session.currentTurn === p.userId && session.status === 'active'
                ? 'border-rose-500 bg-rose-500/10 text-slate-900 dark:text-white font-semibold'
                : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
            }`}
          >
            {p.username} ({marks[p.userId] || '?'}) ·{' '}
            <span className="font-mono-tabular">{session.scores[p.userId] || 0} pts</span>
          </div>
        ))}
      </div>

      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {session.status === 'completed'
          ? session.isDraw
            ? 'Match ended in a draw.'
            : `${players.find((p) => p.userId === session.winnerId)?.username || 'Player'} wins the round.`
          : isMyTurn
          ? `Your turn (${myMark})`
          : `Waiting for ${activePlayer?.username || 'partner'}...`}
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-[320px] sm:max-w-[360px] aspect-square">
        {board.map((cell, idx) => {
          const isWinCell = winningLine?.includes(idx);
          const canClick = isMyTurn && cell === null;
          return (
            <motion.button
              key={idx}
              type="button"
              whileTap={canClick ? { scale: 0.94 } : undefined}
              disabled={!canClick}
              onClick={() => onMove('ttt:place', { index: idx })}
              className={`rounded-2xl border text-4xl sm:text-5xl font-display font-bold flex items-center justify-center transition min-h-[88px] ${
                isWinCell
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : cell
                  ? 'border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5'
                  : canClick
                  ? 'border-slate-200 dark:border-white/15 bg-white dark:bg-[#19142E] hover:border-violet-500 cursor-pointer'
                  : 'border-slate-200 dark:border-white/10 bg-slate-100/60 dark:bg-white/[0.02] cursor-default'
              } ${cell === 'X' ? 'text-rose-500' : 'text-blue-400'}`}
            >
              {cell}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
