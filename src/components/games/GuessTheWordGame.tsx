import React, { useEffect, useRef, useState } from 'react';
import { Delete, Lightbulb, Send } from 'lucide-react';
import type { GameSessionPublic, LetterTileState, RoomPlayer, WordGuessRow } from '../../types/rsverse';

interface GameProps {
  session: GameSessionPublic;
  currentUserId: string;
  players: RoomPlayer[];
  onMove: (moveType: string, payload?: Record<string, unknown>) => Promise<void>;
}

const KEY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

const TILE_COLORS: Record<LetterTileState, string> = {
  correct: 'bg-emerald-600 border-emerald-500 text-white',
  present: 'bg-amber-500 border-amber-400 text-white',
  absent: 'bg-slate-600 dark:bg-slate-700 border-slate-500 text-white',
};

export const GuessTheWordGame: React.FC<GameProps> = ({
  session,
  currentUserId,
  players,
  onMove,
}) => {
  const {
    mode = 'classic',
    wordLength = 5,
    category = 'General',
    maxAttempts = 6,
    phase = 'playing',
    setterId,
    guesserId,
    customHint,
    hintsUsed = 0,
    revealedHintIndices = [],
    revealedHintLetters = {},
    playerBoards = {},
    finishedPlayers = {},
    endsAt,
    revealedWord,
  } = session.state;

  const [currentGuess, setCurrentGuess] = useState('');
  const [customWordInput, setCustomWordInput] = useState('');
  const [customHintInput, setCustomHintInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const partner = players.find((p) => p.userId !== currentUserId);
  const myRows: WordGuessRow[] = playerBoards[currentUserId] || [];
  const opponentRows: Array<{ feedback: LetterTileState[]; guess?: string }> = partner
    ? playerBoards[partner.userId] || []
    : [];
  const iAmFinished = Boolean(finishedPlayers[currentUserId]);
  const isCustomWatcher = mode === 'custom' && setterId === currentUserId;
  const activeGuesserId = mode === 'custom' ? guesserId : currentUserId;

  // Countdown timer for timed / race modes
  useEffect(() => {
    if (!endsAt || session.status !== 'active') {
      setSecondsLeft(null);
      return;
    }
    const tick = () => {
      const rem = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setSecondsLeft(rem);
      if (rem === 0) {
        onMove('word:timeout').catch(() => {});
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt, session.status]);

  // Compute keyboard letter best states
  const keyStates: Record<string, LetterTileState> = {};
  const priority: Record<LetterTileState, number> = { absent: 1, present: 2, correct: 3 };
  for (const row of myRows) {
    row.guess.split('').forEach((ch, idx) => {
      const st = row.feedback[idx];
      if (!keyStates[ch] || priority[st] > priority[keyStates[ch]]) {
        keyStates[ch] = st;
      }
    });
  }

  const submitGuess = async () => {
    if (currentGuess.length !== wordLength) {
      setErrorMsg(`Enter a ${wordLength}-letter word`);
      return;
    }
    setErrorMsg(null);
    try {
      await onMove('word:guess', { guess: currentGuess });
      setCurrentGuess('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid word');
    }
  };

  const handleKeyPress = (key: string) => {
    if (session.status !== 'active' || phase !== 'playing' || iAmFinished || isCustomWatcher) return;
    setErrorMsg(null);
    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACK') {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < wordLength) {
      setCurrentGuess((prev) => prev + key);
    }
  };

  const handleKeyPressRef = useRef(handleKeyPress);
  handleKeyPressRef.current = handleKeyPress;

  // Physical keyboard listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        handleKeyPressRef.current('ENTER');
      } else if (e.key === 'Backspace') {
        handleKeyPressRef.current('BACK');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPressRef.current(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleCustomWordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await onMove('word:set_custom', { word: customWordInput.trim(), hint: customHintInput.trim() });
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-white capitalize">{mode} Mode</span>
          <span>·</span>
          <span className="font-mono-tabular">{wordLength} Letters</span>
          <span>·</span>
          <span>Category: {category}</span>
          {secondsLeft !== null && (
            <>
              <span>·</span>
              <span className="font-mono-tabular font-bold text-rose-500">{secondsLeft}s left</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4 font-mono-tabular">
          {players.map((p) => (
            <span key={p.userId}>
              {p.username}: <strong className="text-violet-500">{session.scores[p.userId] || 0} pts</strong>
            </span>
          ))}
        </div>
      </div>

      {/* Custom Mode: Setter Input */}
      {mode === 'custom' && phase === 'setting_word' && (
        <div className="max-w-md mx-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-6 space-y-4">
          {setterId === currentUserId ? (
            <form onSubmit={handleCustomWordSubmit} className="space-y-4">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Create a Secret Word for {partner?.username || 'Partner'}
              </h3>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Secret Word (4–7 letters, A–Z)
                </label>
                <input
                  type="text"
                  required
                  minLength={4}
                  maxLength={7}
                  value={customWordInput}
                  onChange={(e) => setCustomWordInput(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
                  placeholder="e.g., GALAXY"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] px-4 py-2.5 text-sm font-mono-tabular uppercase tracking-widest text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Optional Custom Hint
                </label>
                <input
                  type="text"
                  value={customHintInput}
                  onChange={(e) => setCustomHintInput(e.target.value)}
                  placeholder="e.g., Where stars live"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                />
              </div>
              {errorMsg && <p className="text-xs text-rose-500">{errorMsg}</p>}
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 text-white text-sm font-semibold cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Lock Secret Word
              </button>
            </form>
          ) : (
            <div className="text-center py-4 text-sm text-slate-600 dark:text-slate-300">
              Waiting for {players.find((p) => p.userId === setterId)?.username} to create a secret word...
            </div>
          )}
        </div>
      )}

      {/* Playing / Completed State */}
      {phase === 'playing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Primary Active Board */}
          <div className="lg:col-span-8 flex flex-col items-center gap-4">
            {customHint && (
              <div className="text-xs text-amber-600 dark:text-amber-300 font-medium">
                Hint: {customHint}
              </div>
            )}

            {(mode === 'hint' || mode === 'category') && session.status === 'active' && !isCustomWatcher && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={hintsUsed >= 2}
                  onClick={async () => {
                    setErrorMsg(null);
                    try {
                      await onMove('word:hint');
                    } catch (err: any) {
                      setErrorMsg(err.message || 'Could not reveal hint');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-500/40 text-amber-600 dark:text-amber-300 text-xs font-medium disabled:opacity-40 cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  Reveal Letter Hint ({2 - hintsUsed} left)
                </button>
                {revealedHintIndices.length > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <span className="text-[11px] font-medium text-amber-600 dark:text-amber-300 mr-1">
                      Clue:
                    </span>
                    {Array.from({ length: wordLength }).map((_, idx) => {
                      const ch = revealedHintLetters?.[idx];
                      return (
                        <span
                          key={idx}
                          className={`w-6 h-7 rounded-md flex items-center justify-center text-xs font-mono-tabular font-bold border ${
                            ch
                              ? 'bg-amber-500/20 border-amber-400 text-amber-700 dark:text-amber-200'
                              : 'bg-white/40 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-400'
                          }`}
                        >
                          {ch || '_'}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-300">
                {errorMsg}
              </div>
            )}

            {revealedWord && (
              <div className="rounded-xl bg-violet-500/15 border border-violet-500/30 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white">
                {isCustomWatcher ? 'Your Secret Word: ' : 'Hidden Word: '}
                <span className="font-mono-tabular font-bold tracking-widest text-rose-500 ml-1">
                  {revealedWord}
                </span>
              </div>
            )}

            {/* Word Grid */}
            <div className="space-y-2">
              {Array.from({ length: maxAttempts }).map((_, rIdx) => {
                const boardToShow = isCustomWatcher ? opponentRows : myRows;
                const submitted = boardToShow[rIdx];
                const isCurrentRow = !isCustomWatcher && rIdx === myRows.length && !iAmFinished && session.status === 'active';

                return (
                  <div key={rIdx} className="flex gap-1.5 sm:gap-2">
                    {Array.from({ length: wordLength }).map((__, cIdx) => {
                      const letter = submitted
                        ? (submitted as WordGuessRow).guess?.[cIdx] || ''
                        : isCurrentRow
                        ? currentGuess[cIdx] || ''
                        : '';
                      const stateClass = submitted
                        ? TILE_COLORS[submitted.feedback[cIdx]]
                        : letter
                        ? 'border-violet-500 bg-white dark:bg-[#1E1738] text-slate-900 dark:text-white'
                        : 'border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white';

                      return (
                        <div
                          key={cIdx}
                          className={`w-11 h-12 sm:w-13 sm:h-13 rounded-xl border-2 font-display text-xl sm:text-2xl font-bold flex items-center justify-center uppercase transition ${stateClass}`}
                        >
                          {letter}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* On-Screen QWERTY Keyboard */}
            {!isCustomWatcher && session.status === 'active' && !iAmFinished && (
              <div className="w-full max-w-lg space-y-1.5 pt-2">
                {KEY_ROWS.map((row, idx) => (
                  <div key={idx} className="flex justify-center gap-1 sm:gap-1.5">
                    {row.map((key) => {
                      const kState = keyStates[key];
                      const isWide = key === 'ENTER' || key === 'BACK';
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleKeyPress(key)}
                          className={`h-11 sm:h-12 rounded-lg font-semibold text-xs sm:text-sm flex items-center justify-center transition cursor-pointer select-none ${
                            isWide ? 'px-2.5 sm:px-3.5 min-w-[52px]' : 'flex-1 max-w-[42px]'
                          } ${
                            kState
                              ? TILE_COLORS[kState]
                              : 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20'
                          }`}
                        >
                          {key === 'BACK' ? <Delete className="w-4 h-4" /> : key}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Opponent Live Progress Mirror */}
          {partner && !isCustomWatcher && (
            <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">{partner.username}&apos;s Progress</span>
                <span className="font-mono-tabular text-slate-500">
                  {opponentRows.length} / {maxAttempts}
                </span>
              </div>
              <div className="space-y-1.5">
                {Array.from({ length: maxAttempts }).map((_, rIdx) => {
                  const row = opponentRows[rIdx];
                  return (
                    <div key={rIdx} className="flex gap-1.5">
                      {Array.from({ length: wordLength }).map((__, cIdx) => {
                        const st = row?.feedback?.[cIdx];
                        return (
                          <div
                            key={cIdx}
                            className={`flex-1 h-6 rounded-md border flex items-center justify-center text-xs font-bold ${
                              st
                                ? TILE_COLORS[st]
                                : 'border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/[0.02]'
                            }`}
                          >
                            {session.status === 'completed' ? row?.guess?.[cIdx] || '' : ''}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Opponent letters remain hidden until the match completes.
              </p>
            </div>
          )}

          {isCustomWatcher && (
            <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-5 text-sm text-slate-600 dark:text-slate-300">
              You set the custom word. Watch {players.find((p) => p.userId === activeGuesserId)?.username}&apos;s attempts update live!
            </div>
          )}
        </div>
      )}
    </div>
  );
};
