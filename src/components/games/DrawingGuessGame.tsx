import React, { useEffect, useRef, useState } from 'react';
import { Eraser, Send, Trash2, Undo2 } from 'lucide-react';
import type { GameSessionPublic, RoomPlayer } from '../../types/rsverse';

interface Stroke {
  color: string;
  width: number;
  points: Array<{ x: number; y: number }>;
}

interface GameProps {
  session: GameSessionPublic;
  currentUserId: string;
  players: RoomPlayer[];
  onMove: (moveType: string, payload?: Record<string, unknown>) => Promise<void>;
  onEmitLiveStroke?: (stroke: Stroke) => void;
  liveRemoteStroke?: Stroke | null;
}

const COLORS = ['#F43F5E', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#FFFFFF', '#0A0714'];

export const DrawingGuessGame: React.FC<GameProps> = ({
  session,
  currentUserId,
  players,
  onMove,
  onEmitLiveStroke,
  liveRemoteStroke,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentPointsRef = useRef<Array<{ x: number; y: number }>>([]);
  const isDrawingRef = useRef(false);
  const lastEmitRef = useRef(0);

  const [brushColor, setBrushColor] = useState('#F43F5E');
  const [brushWidth, setBrushWidth] = useState(5);
  const [guessText, setGuessText] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(75);

  const {
    currentRound = 1,
    totalRounds = 4,
    drawerId,
    secretWord,
    wordLength = 6,
    strokes = [],
    guesses = [],
    roundSolvedBy,
    roundTimedOut,
    roundEndsAt,
  } = session.state;

  const isDrawer = drawerId === currentUserId;
  const roundEnded = Boolean(roundSolvedBy || roundTimedOut);
  const drawerName = players.find((p) => p.userId === drawerId)?.username || 'Drawer';

  // Timer
  useEffect(() => {
    if (session.status !== 'active' || roundEnded || !roundEndsAt) return;
    const tick = () => {
      const rem = Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000));
      setSecondsLeft(rem);
      if (rem === 0 && isDrawer) {
        onMove('draw:timeout').catch(() => {});
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session.status, roundEnded, roundEndsAt, currentRound, isDrawer]);

  // Render committed strokes + live stroke
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const drawStroke = (s: Stroke) => {
      if (!s || !s.points || s.points.length === 0) return;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(s.points[0].x, s.points[0].y);
      for (let i = 1; i < s.points.length; i++) {
        ctx.lineTo(s.points[i].x, s.points[i].y);
      }
      if (s.points.length === 1) {
        ctx.lineTo(s.points[0].x + 0.1, s.points[0].y + 0.1);
      }
      ctx.stroke();
    };

    for (const st of strokes as Stroke[]) drawStroke(st);
    if (!isDrawer && liveRemoteStroke) drawStroke(liveRemoteStroke);
    if (isDrawer && isDrawingRef.current && currentPointsRef.current.length > 0) {
      drawStroke({ color: brushColor, width: brushWidth, points: currentPointsRef.current });
    }
  }, [strokes, liveRemoteStroke, isDrawer, brushColor, brushWidth]);

  const getNormalizedPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const drawSegmentLocally = (pts: Array<{ x: number; y: number }>) => {
    const canvas = canvasRef.current;
    if (!canvas || pts.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const a = pts[pts.length - 2];
    const b = pts[pts.length - 1];
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || roundEnded || session.status !== 'active') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getNormalizedPoint(e);
    currentPointsRef.current = [pt, { x: pt.x + 0.1, y: pt.y + 0.1 }];
    drawSegmentLocally(currentPointsRef.current);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !isDrawer || roundEnded) return;
    const pt = getNormalizedPoint(e);
    currentPointsRef.current.push(pt);
    drawSegmentLocally(currentPointsRef.current);

    const now = Date.now();
    if (now - lastEmitRef.current > 45 && onEmitLiveStroke) {
      lastEmitRef.current = now;
      onEmitLiveStroke({
        color: brushColor,
        width: brushWidth,
        points: currentPointsRef.current,
      });
    }
  };

  const handlePointerUp = async () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const pts = currentPointsRef.current;
    currentPointsRef.current = [];
    if (pts.length > 0) {
      await onMove('draw:stroke', {
        stroke: { color: brushColor, width: brushWidth, points: pts },
      });
    }
  };

  const handleGuessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessText.trim() || isDrawer || roundEnded) return;
    await onMove('draw:guess', { guess: guessText.trim() });
    setGuessText('');
  };

  return (
    <div className="space-y-5">
      {/* Top Info */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
          Round {currentRound} / {totalRounds} · Drawer: {drawerName} · {secondsLeft}s
        </div>
        <div className="flex items-center gap-4 text-sm">
          {players.map((p) => (
            <span key={p.userId} className="font-medium text-slate-700 dark:text-slate-300">
              {p.username}: <span className="font-mono-tabular font-bold text-cyan-500">{session.scores[p.userId] || 0}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Word Prompt Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {isDrawer || roundEnded ? (
          <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
            Secret Word:{' '}
            <span className="font-display text-lg font-bold tracking-wider text-rose-500 ml-1">
              {secretWord}
            </span>
          </div>
        ) : (
          <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
            Guess the drawing:{' '}
            <span className="font-mono-tabular tracking-[0.25em] font-bold text-violet-500 ml-1">
              {'_ '.repeat(wordLength)}({wordLength})
            </span>
          </div>
        )}

        {roundEnded && session.status === 'active' && (
          <button
            type="button"
            onClick={() => onMove('draw:next')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 text-white text-xs font-semibold cursor-pointer"
          >
            {currentRound >= totalRounds ? 'Finish Match' : 'Next Round (Swap Drawer)'}
          </button>
        )}
      </div>

      {/* Canvas + Guesses Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-3">
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/15 bg-white shadow-inner">
            <canvas
              ref={canvasRef}
              width={720}
              height={440}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className={`w-full aspect-[720/440] touch-none block ${
                isDrawer && !roundEnded ? 'cursor-crosshair' : 'cursor-default'
              }`}
            />
          </div>

          {isDrawer && !roundEnded && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24]">
              <div className="flex items-center gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Color ${c}`}
                    onClick={() => setBrushColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition cursor-pointer ${
                      brushColor === c ? 'border-rose-500 scale-110' : 'border-slate-300 dark:border-white/20'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setBrushColor('#FFFFFF')}
                  title="Eraser"
                  className={`p-1.5 rounded-lg border cursor-pointer ${
                    brushColor === '#FFFFFF'
                      ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                      : 'border-slate-200 dark:border-white/10 text-slate-500'
                  }`}
                >
                  <Eraser className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {[3, 6, 12].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setBrushWidth(w)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono-tabular cursor-pointer ${
                      brushWidth === w
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {w}px
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => onMove('draw:undo')}
                  className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                  title="Undo last stroke"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onMove('draw:clear')}
                  className="p-2 rounded-lg border border-slate-200 dark:border-white/10 text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                  title="Clear canvas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Guess Feed */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4 flex flex-col justify-between min-h-[260px]">
          <div className="space-y-2 overflow-y-auto max-h-[320px]">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Live Guesses</div>
            {(guesses as any[]).length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No guesses yet...</p>
            ) : (
              (guesses as any[]).map((g) => {
                const name = players.find((p) => p.userId === g.userId)?.username || 'Player';
                return (
                  <div
                    key={g.id}
                    className={`text-sm px-3 py-2 rounded-xl ${
                      g.isCorrect
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-semibold'
                        : 'bg-white dark:bg-[#130F24] text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="font-semibold">{name}:</span> {g.text}
                  </div>
                );
              })
            )}
          </div>

          {!isDrawer && !roundEnded && session.status === 'active' && (
            <form onSubmit={handleGuessSubmit} className="mt-3 flex gap-2">
              <input
                type="text"
                value={guessText}
                onChange={(e) => setGuessText(e.target.value)}
                placeholder="Type your guess..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-500 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
