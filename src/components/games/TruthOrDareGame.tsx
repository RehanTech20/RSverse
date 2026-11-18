import React, { useState } from 'react';
import { Check, Flame, Heart, Plus, SkipForward, Sparkles } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import type { GameSessionPublic, RoomPlayer } from '../../types/rsverse';

interface GameProps {
  session: GameSessionPublic;
  currentUserId: string;
  players: RoomPlayer[];
  onMove: (moveType: string, payload?: Record<string, unknown>) => Promise<void>;
}

const CATEGORIES = ['All', 'Romantic', 'Funny', 'Interesting', 'Challenging', 'Custom'] as const;

export const TruthOrDareGame: React.FC<GameProps> = ({
  session,
  currentUserId,
  players,
  onMove,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(session.state.category || 'All');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customType, setCustomType] = useState<'truth' | 'dare'>('truth');
  const [customText, setCustomText] = useState('');
  const [savingCustom, setSavingCustom] = useState(false);

  const isMyTurn = session.status === 'active' && session.currentTurn === currentUserId;
  const activePlayer = players.find((p) => p.userId === session.currentTurn);
  const prompt = session.state.currentPrompt;
  const phase = session.state.phase || 'choosing';

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    setSavingCustom(true);
    try {
      await apiRequest('/api/prompts', {
        method: 'POST',
        body: JSON.stringify({
          gameId: 'truth-or-dare',
          category: 'Custom',
          promptType: customType,
          content: customText.trim(),
        }),
      });
      setCustomText('');
      setShowAddCustom(false);
    } finally {
      setSavingCustom(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm">
          {players.map((p) => (
            <span
              key={p.userId}
              className={
                session.currentTurn === p.userId
                  ? 'font-semibold text-rose-500'
                  : 'text-slate-600 dark:text-slate-400'
              }
            >
              {p.username}: <span className="font-mono-tabular">{session.scores[p.userId] || 0} pts</span>
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowAddCustom(!showAddCustom)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Custom Prompt
        </button>
      </div>

      {showAddCustom && (
        <form
          onSubmit={handleAddCustom}
          className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            {(['truth', 'dare'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setCustomType(t)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer ${
                  customType === t
                    ? 'bg-rose-500 text-white'
                    : 'bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Write a custom truth question or dare challenge..."
              className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={savingCustom}
              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              selectedCategory === cat
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Prompt Card */}
      {session.status === 'active' && phase === 'choosing' && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-8 text-center space-y-5">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {isMyTurn
              ? 'It is your turn. Choose Truth or Dare!'
              : `Waiting for ${activePlayer?.username || 'partner'} to pick Truth or Dare...`}
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              type="button"
              disabled={!isMyTurn}
              onClick={() => onMove('tod:draw', { type: 'truth', category: selectedCategory })}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold disabled:opacity-40 hover:opacity-95 transition cursor-pointer"
            >
              <Heart className="w-5 h-5" />
              Truth
            </button>
            <button
              type="button"
              disabled={!isMyTurn}
              onClick={() => onMove('tod:draw', { type: 'dare', category: selectedCategory })}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold disabled:opacity-40 hover:opacity-95 transition cursor-pointer"
            >
              <Flame className="w-5 h-5" />
              Dare
            </button>
          </div>
        </div>
      )}

      {prompt && (
        <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-violet-500/10 to-transparent p-7 space-y-5">
          <div className="text-xs font-medium text-rose-500 dark:text-rose-300 uppercase tracking-wider">
            {prompt.category} · {prompt.type} for{' '}
            {players.find((p) => p.userId === prompt.forUserId)?.username}
          </div>
          <p className="font-display text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white leading-snug">
            {prompt.text}
          </p>

          {session.status === 'active' && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onMove('tod:complete')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Completed (+10 pts)
              </button>
              <button
                type="button"
                onClick={() => onMove('tod:skip')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
                Skip Turn
              </button>
            </div>
          )}
        </div>
      )}

      {session.status === 'active' && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onMove('tod:end')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-500 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Finish & Record Match Scores
          </button>
        </div>
      )}
    </div>
  );
};
