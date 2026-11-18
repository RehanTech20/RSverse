import React, { useState } from 'react';
import { Check, Heart, Plus, Send } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import type { GameSessionPublic, RoomPlayer } from '../../types/rsverse';

interface GameProps {
  session: GameSessionPublic;
  currentUserId: string;
  players: RoomPlayer[];
  onMove: (moveType: string, payload?: Record<string, unknown>) => Promise<void>;
}

export const WhoKnowsWhoGame: React.FC<GameProps> = ({
  session,
  currentUserId,
  players,
  onMove,
}) => {
  const [answer, setAnswer] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');

  const {
    currentRound = 1,
    totalRounds = 5,
    subjectUserId,
    question,
    phase,
    submittedBy = {},
    myAnswer,
    lastComparison,
    compatibility = 0,
  } = session.state;

  const subjectPlayer = players.find((p) => p.userId === subjectUserId);
  const iSubmitted = Boolean(submittedBy[currentUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    await onMove('wkw:submit', { answer: answer.trim() });
    setAnswer('');
  };

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    await apiRequest('/api/prompts', {
      method: 'POST',
      body: JSON.stringify({
        gameId: 'who-knows-who',
        category: 'Custom',
        promptType: 'question',
        content: customQuestion.trim(),
      }),
    });
    setCustomQuestion('');
    setShowCustom(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-mono-tabular">
          Question {currentRound} of {totalRounds} · Compatibility: {compatibility}%
        </span>
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-400 font-medium hover:underline cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Question for Future Rounds
        </button>
      </div>

      {showCustom && (
        <form onSubmit={handleAddCustom} className="flex gap-2">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="e.g., What is my secret midnight snack?"
            className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] px-3.5 py-2 text-sm text-slate-900 dark:text-white"
          />
          <button type="submit" className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium cursor-pointer">
            Save
          </button>
        </form>
      )}

      {session.status === 'completed' ? (
        <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/15 via-violet-500/10 to-transparent p-8 text-center space-y-3">
          <Heart className="w-10 h-10 text-rose-500 fill-rose-500 mx-auto" />
          <div className="font-display text-4xl font-bold font-mono-tabular text-slate-900 dark:text-white">
            {compatibility}% Match
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {compatibility >= 80
              ? 'Incredible sync — you unlocked the Perfect Match achievement!'
              : 'Every round teaches you something new about each other.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-6 space-y-5">
          <div className="text-xs font-medium text-rose-500 dark:text-rose-300">
            About {subjectPlayer?.username || 'Player'}
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
            {question}
          </h3>

          {phase === 'answering' && (
            <>
              {iSubmitted ? (
                <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 text-sm text-slate-700 dark:text-slate-200">
                  Your answer (<span className="font-semibold">{myAnswer}</span>) is locked. Waiting for your partner...
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    required
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder={
                      subjectUserId === currentUserId
                        ? 'Enter your true answer...'
                        : `Guess ${subjectPlayer?.username}'s answer...`
                    }
                    className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 text-white text-sm font-semibold cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    Lock Answer
                  </button>
                </form>
              )}
            </>
          )}

          {phase === 'revealed' && lastComparison && (
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-white/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {players.map((p) => (
                  <div
                    key={p.userId}
                    className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-3.5"
                  >
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {p.username} {p.userId === subjectUserId ? '(Truth)' : '(Guess)'}
                    </div>
                    <div className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {lastComparison.answers?.[p.userId]}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`text-sm font-semibold ${
                    lastComparison.matched ? 'text-emerald-500' : 'text-amber-500'
                  }`}
                >
                  {lastComparison.matched ? 'Exact / Close Match! (+20 pts each)' : 'Different answers this round.'}
                </span>

                <div className="flex items-center gap-2">
                  {!lastComparison.matched && (
                    <button
                      type="button"
                      onClick={() => onMove('wkw:override_match')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/10 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Count as Match
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onMove('wkw:next')}
                    className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 cursor-pointer"
                  >
                    {currentRound >= totalRounds ? 'See Final Score' : 'Next Question'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
