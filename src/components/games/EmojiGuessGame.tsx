import React, { useEffect, useState } from 'react';
import { Lightbulb, Send, SkipForward } from 'lucide-react';
import type { GameSessionPublic, RoomPlayer } from '../../types/rsverse';

interface GameProps {
  session: GameSessionPublic;
  currentUserId: string;
  players: RoomPlayer[];
  onMove: (moveType: string, payload?: Record<string, unknown>) => Promise<void>;
}

export const EmojiGuessGame: React.FC<GameProps> = ({
  session,
  currentUserId,
  players,
  onMove,
}) => {
  const [guess, setGuess] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(45);

  const {
    currentRound = 1,
    totalRounds = 5,
    emojis,
    category,
    difficulty,
    hintRevealed,
    hintText,
    roundRevealed,
    revealedAnswer,
    solvedBy,
    roundEndsAt,
    lastWrongGuess,
  } = session.state;

  useEffect(() => {
    if (session.status !== 'active' || roundRevealed || !roundEndsAt) return;
    const tick = () => {
      const rem = Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000));
      setSecondsLeft(rem);
      if (rem === 0) {
        onMove('emoji:timeout').catch(() => {});
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session.status, roundRevealed, roundEndsAt, currentRound]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;
    await onMove('emoji:guess', { guess: guess.trim() });
    setGuess('');
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Scores */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
          Round {currentRound} / {totalRounds} · {category} · {difficulty}
        </div>
        <div className="flex items-center gap-4 text-sm">
          {players.map((p) => (
            <span key={p.userId} className="font-medium text-slate-700 dark:text-slate-300">
              {p.username}: <span className="font-mono-tabular font-bold text-amber-500">{session.scores[p.userId] || 0}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Puzzle Box */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-8 text-center space-y-4">
        <div className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
          {roundRevealed ? 'Round Complete' : `Time Remaining: ${secondsLeft}s`}
        </div>
        <div className="text-5xl sm:text-6xl tracking-widest py-3 select-none">{emojis}</div>

        {hintRevealed && hintText && (
          <p className="text-sm text-amber-600 dark:text-amber-300 font-medium">
            Hint: {hintText}
          </p>
        )}

        {roundRevealed ? (
          <div className="space-y-4 pt-2">
            <div className="text-lg font-bold text-emerald-500">
              Answer: {revealedAnswer}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {solvedBy
                ? `${players.find((p) => p.userId === solvedBy)?.username} solved it!`
                : 'Time ran out or skipped.'}
            </div>
            {session.status === 'active' && (
              <button
                type="button"
                onClick={() => onMove('emoji:next')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 text-white text-sm font-semibold cursor-pointer"
              >
                {currentRound >= totalRounds ? 'Finish Match' : 'Next Puzzle'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Type your guess..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Guess
              </button>
            </form>

            {lastWrongGuess && lastWrongGuess.userId === currentUserId && (
              <div className="text-xs text-rose-500">
                Not quite: &ldquo;{lastWrongGuess.guess}&rdquo; — keep trying!
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              {!hintRevealed && (
                <button
                  type="button"
                  onClick={() => onMove('emoji:hint')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-500/40 text-amber-600 dark:text-amber-300 text-xs font-medium hover:bg-amber-500/10 cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  Reveal Hint
                </button>
              )}
              <button
                type="button"
                onClick={() => onMove('emoji:skip')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Skip Puzzle
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
