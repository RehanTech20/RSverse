import React from 'react';
import { motion } from 'motion/react';
import { Hand, Scissors, Shield } from 'lucide-react';
import type { GameSessionPublic, RoomPlayer } from '../../types/rsverse';

interface GameProps {
  session: GameSessionPublic;
  currentUserId: string;
  players: RoomPlayer[];
  onMove: (moveType: string, payload?: Record<string, unknown>) => Promise<void>;
}

const CHOICES = [
  { id: 'rock', label: 'Rock', emoji: '🪨', icon: Shield },
  { id: 'paper', label: 'Paper', emoji: '📄', icon: Hand },
  { id: 'scissors', label: 'Scissors', emoji: '✂️', icon: Scissors },
] as const;

export const RockPaperScissorsGame: React.FC<GameProps> = ({
  session,
  currentUserId,
  players,
  onMove,
}) => {
  const { bestOf = 3, currentRound = 1, lockedBy = {}, myPick, phase, lastRoundResult, history = [] } = session.state;
  const partner = players.find((p) => p.userId !== currentUserId);
  const iLocked = Boolean(lockedBy[currentUserId]);
  const partnerLocked = partner ? Boolean(lockedBy[partner.userId]) : false;

  return (
    <div className="flex flex-col items-center gap-6 max-w-xl mx-auto">
      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
        Round {currentRound} · Best of {bestOf}
      </div>

      {/* Live Round Scoreboard */}
      <div className="w-full grid grid-cols-2 gap-4">
        {players.map((p) => (
          <div
            key={p.userId}
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 flex items-center justify-between"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{p.username}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {phase === 'picking'
                  ? lockedBy[p.userId]
                    ? 'Selection locked'
                    : 'Choosing...'
                  : 'Revealed'}
              </div>
            </div>
            <div className="font-display text-2xl font-bold font-mono-tabular text-rose-500">
              {session.status === 'completed'
                ? session.state.roundWins?.[p.userId] ?? 0
                : session.scores[p.userId] ?? 0}
            </div>
          </div>
        ))}
      </div>

      {/* Picking Phase */}
      {session.status === 'active' && phase === 'picking' && (
        <div className="w-full space-y-4 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {iLocked
              ? partnerLocked
                ? 'Revealing both choices...'
                : `You locked ${myPick}. Waiting for ${partner?.username || 'partner'}...`
              : 'Choose secretly. Your pick stays hidden until both players lock in.'}
          </p>

          <div className="grid grid-cols-3 gap-3">
            {CHOICES.map((c) => {
              const selected = myPick === c.id;
              return (
                <motion.button
                  key={c.id}
                  type="button"
                  whileTap={!iLocked ? { scale: 0.95 } : undefined}
                  disabled={iLocked}
                  onClick={() => onMove('rps:pick', { choice: c.id })}
                  className={`rounded-2xl border p-5 flex flex-col items-center gap-2 transition min-h-[110px] ${
                    selected
                      ? 'border-rose-500 bg-rose-500/15 text-slate-900 dark:text-white'
                      : iLocked
                      ? 'border-slate-200 dark:border-white/10 opacity-45 cursor-default'
                      : 'border-slate-200 dark:border-white/15 bg-white dark:bg-[#19142E] hover:border-violet-500 cursor-pointer'
                  }`}
                >
                  <span className="text-3xl">{c.emoji}</span>
                  <span className="text-sm font-semibold">{c.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Simultaneous Reveal */}
      {(phase === 'revealed' || session.status === 'completed') && lastRoundResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-6 text-center space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            {players.map((p) => {
              const pickId = lastRoundResult.picks?.[p.userId];
              const meta = CHOICES.find((c) => c.id === pickId);
              return (
                <div key={p.userId} className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">{p.username}</div>
                  <div className="text-4xl">{meta?.emoji}</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{meta?.label}</div>
                </div>
              );
            })}
          </div>

          <div className="text-base font-bold text-rose-500">
            {lastRoundResult.winnerId
              ? `${players.find((p) => p.userId === lastRoundResult.winnerId)?.username} won Round ${lastRoundResult.round}!`
              : `Round ${lastRoundResult.round} was a tie!`}
          </div>

          {session.status === 'active' && (
            <button
              type="button"
              onClick={() => onMove('rps:next_round')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 text-white text-sm font-semibold hover:opacity-95 transition cursor-pointer"
            >
              Next Round
            </button>
          )}
        </motion.div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="w-full text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <div className="font-medium">Round History</div>
          <div className="flex flex-wrap gap-3">
            {history.map((h: any) => (
              <span key={h.round} className="font-mono-tabular">
                R{h.round}: {h.winnerId ? players.find((p) => p.userId === h.winnerId)?.username : 'Tie'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
