import React from 'react';
import { motion } from 'motion/react';
import type { GameSessionPublic, RoomPlayer } from '../../types/rsverse';

interface GameProps {
  session: GameSessionPublic;
  currentUserId: string;
  players: RoomPlayer[];
  onMove: (moveType: string, payload?: Record<string, unknown>) => Promise<void>;
}

export const Connect4Game: React.FC<GameProps> = ({
  session,
  currentUserId,
  players,
  onMove,
}) => {
  const board: Array<Array<'red' | 'yellow' | null>> =
    session.state.board || Array.from({ length: 6 }, () => Array(7).fill(null));
  const colors: Record<string, 'red' | 'yellow'> = session.state.colors || {};
  const winningCells: Array<[number, number]> | null = session.state.winningCells || null;
  const isMyTurn = session.status === 'active' && session.currentTurn === currentUserId;
  const myColor = colors[currentUserId] || 'red';
  const activePlayer = players.find((p) => p.userId === session.currentTurn);

  const isWinCell = (r: number, c: number) =>
    winningCells?.some(([wr, wc]) => wr === r && wc === c) ?? false;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
        {players.map((p) => {
          const col = colors[p.userId];
          return (
            <div
              key={p.userId}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                session.currentTurn === p.userId && session.status === 'active'
                  ? 'border-violet-500 bg-violet-500/10 font-semibold text-slate-900 dark:text-white'
                  : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  col === 'red' ? 'bg-rose-500' : 'bg-amber-400'
                }`}
              />
              <span>{p.username}</span>
            </div>
          );
        })}
      </div>

      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {session.status === 'completed'
          ? session.isDraw
            ? 'Board full — Match Draw!'
            : `${players.find((p) => p.userId === session.winnerId)?.username || 'Player'} connected four!`
          : isMyTurn
          ? `Your turn — Tap a column to drop (${myColor === 'red' ? 'Rose Red' : 'Amber Gold'})`
          : `Waiting for ${activePlayer?.username || 'partner'}...`}
      </div>

      {/* 7x6 Board */}
      <div className="w-full max-w-[440px] rounded-2xl bg-[#1E163B] dark:bg-[#191233] p-3 sm:p-4 border border-violet-500/25 shadow-xl">
        {/* Column Drop Buttons */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
          {Array.from({ length: 7 }).map((_, colIdx) => {
            const colFull = board[0][colIdx] !== null;
            const canDrop = isMyTurn && !colFull;
            return (
              <button
                key={colIdx}
                type="button"
                disabled={!canDrop}
                onClick={() => onMove('c4:drop', { col: colIdx })}
                className={`h-8 rounded-lg text-xs font-mono-tabular font-semibold transition ${
                  canDrop
                    ? 'bg-white/10 hover:bg-rose-500 text-white cursor-pointer'
                    : 'bg-white/5 text-slate-500 cursor-default opacity-50'
                }`}
              >
                ↓
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {board.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const win = isWinCell(rIdx, cIdx);
              const colFull = board[0][cIdx] !== null;
              const canClick = isMyTurn && !colFull;
              return (
                <button
                  key={`${rIdx}-${cIdx}`}
                  type="button"
                  disabled={!canClick}
                  onClick={() => onMove('c4:drop', { col: cIdx })}
                  className={`aspect-square rounded-full flex items-center justify-center transition p-1 ${
                    canClick ? 'cursor-pointer' : 'cursor-default'
                  } bg-[#0B0718]`}
                >
                  {cell && (
                    <motion.span
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.18 }}
                      className={`w-full h-full rounded-full ${
                        cell === 'red'
                          ? 'bg-gradient-to-br from-rose-400 to-rose-600'
                          : 'bg-gradient-to-br from-amber-300 to-amber-500'
                      } ${win ? 'ring-3 ring-white shadow-lg' : ''}`}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
