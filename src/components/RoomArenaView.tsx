import React, { Suspense, useState } from 'react';
import {
  Check,
  Copy,
  DoorOpen,
  LogOut,
  Play,
  PlusSquare,
  RotateCcw,
  Trophy,
  Users,
} from 'lucide-react';
import type {
  GameCatalogItem,
  GameId,
  GameSessionPublic,
  Room,
  WordCategory,
  WordMode,
} from '../types/rsverse';

const TicTacToeGame = React.lazy(() => import('./games/TicTacToeGame').then((m) => ({ default: m.TicTacToeGame })));
const RockPaperScissorsGame = React.lazy(() => import('./games/RockPaperScissorsGame').then((m) => ({ default: m.RockPaperScissorsGame })));
const Connect4Game = React.lazy(() => import('./games/Connect4Game').then((m) => ({ default: m.Connect4Game })));
const MemoryMatchGame = React.lazy(() => import('./games/MemoryMatchGame').then((m) => ({ default: m.MemoryMatchGame })));
const TruthOrDareGame = React.lazy(() => import('./games/TruthOrDareGame').then((m) => ({ default: m.TruthOrDareGame })));
const WhoKnowsWhoGame = React.lazy(() => import('./games/WhoKnowsWhoGame').then((m) => ({ default: m.WhoKnowsWhoGame })));
const EmojiGuessGame = React.lazy(() => import('./games/EmojiGuessGame').then((m) => ({ default: m.EmojiGuessGame })));
const DrawingGuessGame = React.lazy(() => import('./games/DrawingGuessGame').then((m) => ({ default: m.DrawingGuessGame })));
const GuessTheWordGame = React.lazy(() => import('./games/GuessTheWordGame').then((m) => ({ default: m.GuessTheWordGame })));

interface RoomArenaViewProps {
  currentUserId: string;
  games: GameCatalogItem[];
  room: Room | null;
  session: GameSessionPublic | null;
  availableRooms: Room[];
  liveRemoteStroke: any;
  onCreateRoom: (gameId?: GameId, settings?: Record<string, unknown>) => Promise<void>;
  onJoinRoom: (inviteCode: string) => Promise<void>;
  onSelectGame: (gameId: GameId, settings?: Record<string, unknown>) => Promise<void>;
  onToggleReady: () => Promise<void>;
  onStartGame: () => Promise<void>;
  onRematch: () => Promise<void>;
  onLeaveRoom: () => Promise<void>;
  onGameMove: (moveType: string, payload?: Record<string, unknown>) => Promise<void>;
  onEmitLiveStroke: (stroke: any) => void;
}

const WORD_MODES: Array<{ id: WordMode; label: string }> = [
  { id: 'classic', label: 'Classic' },
  { id: 'race', label: 'Race' },
  { id: 'timed', label: 'Timed' },
  { id: 'hint', label: 'Hint' },
  { id: 'category', label: 'Category' },
  { id: 'custom', label: 'Custom Word' },
];

const WORD_CATEGORIES: WordCategory[] = [
  'General',
  'Romantic',
  'Animals',
  'Food',
  'Movies',
  'Anime',
  'Technology',
  'Sports',
];

export const RoomArenaView: React.FC<RoomArenaViewProps> = ({
  currentUserId,
  games,
  room,
  session,
  availableRooms,
  liveRemoteStroke,
  onCreateRoom,
  onJoinRoom,
  onSelectGame,
  onToggleReady,
  onStartGame,
  onRematch,
  onLeaveRoom,
  onGameMove,
  onEmitLiveStroke,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const runAction = async (fn: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await fn();
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.inviteCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // No active room: Create or Join view
  if (!room) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-10">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
            Multiplayer Room Hub
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Create a private room to get an invitation code, or enter your partner&apos;s code to sync up.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Create a New Room
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Generate a unique room ID and 6-character invitation code for your partner.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction(() => onCreateRoom('tic-tac-toe'))}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 py-3 px-5 text-sm font-semibold text-white hover:opacity-95 transition cursor-pointer"
            >
              <PlusSquare className="w-4 h-4" />
              Create Private Room
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!joinCode.trim()) return;
              runAction(() => onJoinRoom(joinCode.trim()));
            }}
            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-6 space-y-4"
          >
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
              Join by Invitation Code
            </h2>
            <input
              type="text"
              required
              maxLength={8}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code (e.g. A7K9P2)"
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm font-mono-tabular uppercase tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="submit"
              disabled={busy || !joinCode.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-white/10 hover:bg-violet-600 py-3 px-5 text-sm font-semibold text-white transition cursor-pointer"
            >
              <DoorOpen className="w-4 h-4" />
              Join Room
            </button>
          </form>
        </div>

        {/* Active Universe Rooms */}
        {availableRooms.length > 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Open Rooms in Your Universe
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {availableRooms.map((r) => {
                const gameName = games.find((g) => g.id === r.selectedGameId)?.name || 'Selecting Game';
                return (
                  <div key={r.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {gameName} · <span className="font-mono-tabular text-rose-500">{r.inviteCode}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {r.players.map((p) => p.username).join(' & ')} · {r.players.length}/2 players
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => runAction(() => onJoinRoom(r.inviteCode))}
                      className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-500 cursor-pointer"
                    >
                      Join Room
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  const meInRoom = room.players.find((p) => p.userId === currentUserId);
  const bothPresent = room.players.length === 2;
  const bothReady = bothPresent && room.players.every((p) => p.isReady);
  const selectedGame = games.find((g) => g.id === room.selectedGameId);
  const isPlayingOrDone = Boolean(session && (room.status === 'playing' || room.status === 'completed'));
  const settings = room.settings || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-10">
      {/* Room Header Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Room ID: <span className="font-mono-tabular">{room.id.slice(0, 8)}</span></span>
            <span>·</span>
            <span className="capitalize">Status: {room.status}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {selectedGame?.name || 'Multiplayer Room'}
            </h1>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 px-2.5 py-1 text-xs font-mono-tabular font-semibold text-rose-500 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : room.inviteCode}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isPlayingOrDone && (
            <button
              type="button"
              disabled={busy}
              onClick={() => runAction(() => onSelectGame(room.selectedGameId || 'tic-tac-toe', room.settings))}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/15 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
            >
              Change Game
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => runAction(onLeaveRoom)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-medium hover:bg-rose-500/10 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Leave Room
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-200">
          {error}
        </div>
      )}

      {/* Lobby View (When Waiting or Ready) */}
      {!isPlayingOrDone && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Players & Ready Controls */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-6 space-y-5">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Players in Room ({room.players.length}/2)
            </h2>

            <div className="space-y-3">
              {room.players.map((p) => (
                <div
                  key={p.userId}
                  className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.avatarUrl}
                      alt={p.username}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {p.username} {p.userId === currentUserId ? '(You)' : ''}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${p.isOnline ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                        <span>{p.isOnline ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      p.isReady ? 'text-emerald-500' : 'text-amber-500'
                    }`}
                  >
                    {p.isReady ? 'Ready' : 'Not Ready'}
                  </span>
                </div>
              ))}

              {!bothPresent && (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/15 p-4 text-center space-y-1.5">
                  <Users className="w-5 h-5 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Share code <strong className="font-mono-tabular text-rose-500">{room.inviteCode}</strong> with your partner to join.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => runAction(onToggleReady)}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                  meInRoom?.isReady
                    ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                    : 'bg-slate-900 dark:bg-white/10 text-white hover:bg-violet-600'
                }`}
              >
                {meInRoom?.isReady ? 'Ready (Click to Cancel)' : 'Mark as Ready'}
              </button>

              <button
                type="button"
                disabled={busy || !bothReady}
                onClick={() => runAction(onStartGame)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 text-white text-sm font-semibold disabled:opacity-40 hover:opacity-95 transition cursor-pointer"
              >
                <Play className="w-4 h-4" />
                {bothReady ? 'Start Match' : 'Waiting for Both Players Ready'}
              </button>
            </div>
          </div>

          {/* Synchronized Game Selector & Mode Options */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-6 space-y-5">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Synchronized Game Selection
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {games.map((g) => {
                const selected = room.selectedGameId === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => runAction(() => onSelectGame(g.id, {}))}
                    className={`text-left rounded-xl border p-3 transition cursor-pointer ${
                      selected
                        ? 'border-rose-500 bg-rose-500/10 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-white/10 hover:border-violet-500/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{g.category}</div>
                    <div className="text-sm font-semibold mt-0.5 truncate">{g.name}</div>
                  </button>
                );
              })}
            </div>

            {/* Game-Specific Settings */}
            {room.selectedGameId === 'rock-paper-scissors' && (
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-2">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Match Length</div>
                <div className="flex gap-2">
                  {[3, 5, 10].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => runAction(() => onSelectGame('rock-paper-scissors', { bestOf: n }))}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                        (Number(settings.bestOf) || 3) === n
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Best of {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {room.selectedGameId === 'memory-match' && (
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-2">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Board Size</div>
                <div className="flex gap-2">
                  {[8, 12].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => runAction(() => onSelectGame('memory-match', { pairCount: p }))}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                        (Number(settings.pairCount) || 8) === p
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {p} Pairs ({p * 2} Cards)
                    </button>
                  ))}
                </div>
              </div>
            )}

            {room.selectedGameId === 'emoji-guess' && (
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-2">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Difficulty</div>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => runAction(() => onSelectGame('emoji-guess', { difficulty: diff }))}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize cursor-pointer ${
                        (settings.difficulty || 'all') === diff
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {room.selectedGameId === 'guess-the-word' && (
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-4">
                <div>
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Game Mode</div>
                  <div className="flex flex-wrap gap-2">
                    {WORD_MODES.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          runAction(() => onSelectGame('guess-the-word', { ...settings, mode: m.id }))
                        }
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                          (settings.mode || 'classic') === m.id
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(settings.mode || 'classic') !== 'custom' && (
                  <div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Word Length</div>
                    <div className="flex gap-2">
                      {[4, 5, 6, 7].map((len) => (
                        <button
                          key={len}
                          type="button"
                          onClick={() =>
                            runAction(() => onSelectGame('guess-the-word', { ...settings, wordLength: len }))
                          }
                          className={`px-3.5 py-2 rounded-xl text-xs font-mono-tabular font-semibold cursor-pointer ${
                            (Number(settings.wordLength) || 5) === len
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {len} Letters
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {((settings.mode as string) === 'category' || (settings.mode as string) === 'hint') && (
                  <div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Category</div>
                    <div className="flex flex-wrap gap-1.5">
                      {WORD_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() =>
                            runAction(() => onSelectGame('guess-the-word', { ...settings, category: cat }))
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                            (settings.category || 'General') === cat
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {((settings.mode as string) === 'timed' || (settings.mode as string) === 'race') && (
                  <div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Timer Speed</div>
                    <div className="flex gap-2">
                      {(['easy', 'medium', 'hard'] as const).map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() =>
                            runAction(() => onSelectGame('guess-the-word', { ...settings, timedDifficulty: d }))
                          }
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize cursor-pointer ${
                            (settings.timedDifficulty || 'medium') === d
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {d} ({d === 'easy' ? '120s' : d === 'hard' ? '45s' : '75s'})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Game Arena */}
      {isPlayingOrDone && session && (
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-5 sm:p-8 space-y-6">
          {/* Match Completed Banner */}
          {session.status === 'completed' && (
            <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-rose-500/15 via-violet-500/15 to-blue-500/15 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-7 h-7 text-amber-400 shrink-0" />
                <div>
                  <div className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    {session.isDraw
                      ? 'Match Complete — Draw!'
                      : `${room.players.find((p) => p.userId === session.winnerId)?.username || 'Player'} Wins!`}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Scores recorded to your shared leaderboard.
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={() => runAction(onRematch)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 text-white text-sm font-semibold hover:opacity-95 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Rematch
              </button>
            </div>
          )}

          <Suspense
            fallback={
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <div className="w-7 h-7 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                <span>Loading game arena...</span>
              </div>
            }
          >
            {session.gameId === 'tic-tac-toe' && (
              <TicTacToeGame session={session} currentUserId={currentUserId} players={room.players} onMove={onGameMove} />
            )}
            {session.gameId === 'rock-paper-scissors' && (
              <RockPaperScissorsGame session={session} currentUserId={currentUserId} players={room.players} onMove={onGameMove} />
            )}
            {session.gameId === 'connect-4' && (
              <Connect4Game session={session} currentUserId={currentUserId} players={room.players} onMove={onGameMove} />
            )}
            {session.gameId === 'memory-match' && (
              <MemoryMatchGame session={session} currentUserId={currentUserId} players={room.players} onMove={onGameMove} />
            )}
            {session.gameId === 'truth-or-dare' && (
              <TruthOrDareGame session={session} currentUserId={currentUserId} players={room.players} onMove={onGameMove} />
            )}
            {session.gameId === 'who-knows-who' && (
              <WhoKnowsWhoGame session={session} currentUserId={currentUserId} players={room.players} onMove={onGameMove} />
            )}
            {session.gameId === 'emoji-guess' && (
              <EmojiGuessGame session={session} currentUserId={currentUserId} players={room.players} onMove={onGameMove} />
            )}
            {session.gameId === 'drawing-guess' && (
              <DrawingGuessGame
                session={session}
                currentUserId={currentUserId}
                players={room.players}
                onMove={onGameMove}
                onEmitLiveStroke={onEmitLiveStroke}
                liveRemoteStroke={liveRemoteStroke}
              />
            )}
            {session.gameId === 'guess-the-word' && (
              <GuessTheWordGame session={session} currentUserId={currentUserId} players={room.players} onMove={onGameMove} />
            )}
          </Suspense>
        </div>
      )}
    </div>
  );
};
