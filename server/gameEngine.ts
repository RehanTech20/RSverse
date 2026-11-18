import crypto from 'node:crypto';
import {
  db,
  evaluateAndUnlockAchievements,
  getCustomPrompts,
  getRoomById,
} from './db';
import {
  DRAWING_WORDS,
  EMOJI_PUZZLES,
  getWordsByLength,
  isValidDictionaryWord,
  TRUTH_OR_DARE_DECK,
  WHO_KNOWS_WHO_QUESTIONS,
} from './wordBank';
import type {
  GameId,
  GameSessionPublic,
  LetterTileState,
  WordCategory,
  WordMode,
} from '../src/types/rsverse';

export interface SessionEngineResult {
  sessionId: string;
  roomId: string;
  newlyUnlockedByUser: Record<string, any[]>;
  delayedAction?: { delayMs: number; fn: () => void };
}

function getSessionRow(sessionId: string): any | null {
  return db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(sessionId) as any;
}

export function sanitizeSessionForUser(sessionRow: any, viewerUserId: string): GameSessionPublic {
  const state = JSON.parse(sessionRow.state_json || '{}');
  const secret = JSON.parse(sessionRow.secret_state_json || '{}');
  const scores = JSON.parse(sessionRow.scores_json || '{}');
  const isCompleted = sessionRow.status === 'completed';

  let projectedState: Record<string, any> = { ...state };

  if (sessionRow.game_id === 'rock-paper-scissors') {
    const picks = secret.picks || {};
    const lockedBy: Record<string, boolean> = {};
    for (const uid of Object.keys(scores)) {
      lockedBy[uid] = Boolean(picks[uid]);
    }
    projectedState.lockedBy = lockedBy;
    if (picks[viewerUserId]) {
      projectedState.myPick = picks[viewerUserId];
    }
  } else if (sessionRow.game_id === 'memory-match') {
    const deck: string[] = secret.deck || [];
    const matchedBy: Record<number, string> = state.matchedBy || {};
    const flipped: number[] = state.flippedIndices || [];
    projectedState.cards = deck.map((sym, idx) => {
      const isMatched = Boolean(matchedBy[idx]);
      const isFlipped = flipped.includes(idx);
      return {
        index: idx,
        symbol: isMatched || isFlipped || isCompleted ? sym : null,
        isFlipped: isFlipped || isMatched,
        isMatched,
        matchedBy: matchedBy[idx] || null,
      };
    });
  } else if (sessionRow.game_id === 'who-knows-who') {
    const answers = secret.answers || {};
    const submittedBy: Record<string, boolean> = {};
    for (const uid of Object.keys(scores)) {
      submittedBy[uid] = Boolean(answers[uid]);
    }
    projectedState.submittedBy = submittedBy;
    if (answers[viewerUserId]) {
      projectedState.myAnswer = answers[viewerUserId];
    }
  } else if (sessionRow.game_id === 'emoji-guess') {
    if (isCompleted || state.roundRevealed) {
      projectedState.revealedAnswer = secret.answer;
    }
  } else if (sessionRow.game_id === 'drawing-guess') {
    if (state.drawerId === viewerUserId || isCompleted || state.roundSolvedBy || state.roundTimedOut) {
      projectedState.secretWord = secret.word;
    }
  } else if (sessionRow.game_id === 'guess-the-word') {
    const playerBoards: Record<string, any[]> = state.playerBoards || {};
    const sanitizedBoards: Record<string, any[]> = {};
    for (const [uid, rows] of Object.entries(playerBoards)) {
      if (uid === viewerUserId || isCompleted) {
        sanitizedBoards[uid] = rows;
      } else {
        sanitizedBoards[uid] = rows.map((r) => ({ feedback: r.feedback }));
      }
    }
    projectedState.playerBoards = sanitizedBoards;

    const hintIndices: number[] = Array.isArray(state.revealedHintIndices) ? state.revealedHintIndices : [];
    const targetUpper = String(secret.word || '').toUpperCase();
    const revealedHintLetters: Record<number, string> = {};
    for (const idx of hintIndices) {
      if (targetUpper[idx]) {
        revealedHintLetters[idx] = targetUpper[idx];
      }
    }
    projectedState.revealedHintLetters = revealedHintLetters;

    if (isCompleted || (state.mode === 'custom' && state.setterId === viewerUserId)) {
      projectedState.revealedWord = secret.word;
    }
  }

  return {
    id: sessionRow.id,
    roomId: sessionRow.room_id,
    gameId: sessionRow.game_id,
    status: sessionRow.status,
    currentTurn: sessionRow.current_turn,
    winnerId: sessionRow.winner_id,
    isDraw: Boolean(sessionRow.is_draw),
    roundNumber: sessionRow.round_number,
    startedAt: sessionRow.started_at,
    endedAt: sessionRow.ended_at,
    scores,
    state: projectedState,
  };
}

export function getSanitizedSession(sessionId: string, viewerUserId: string): GameSessionPublic | null {
  const row = getSessionRow(sessionId);
  if (!row) return null;
  return sanitizeSessionForUser(row, viewerUserId);
}

export function createGameSession(
  roomId: string,
  gameId: GameId,
  playerIds: string[],
  settings: Record<string, any> = {},
  roundNumber = 1
): string {
  const sessionId = crypto.randomUUID();
  const now = new Date().toISOString();
  const p1 = playerIds[0];
  const p2 = playerIds[1] || playerIds[0];
  const starter = roundNumber % 2 === 1 ? p1 : p2;

  const scores: Record<string, number> = {};
  for (const pid of playerIds) scores[pid] = 0;

  let state: Record<string, any> = {};
  let secret: Record<string, any> = {};
  let currentTurn: string | null = starter;

  switch (gameId) {
    case 'tic-tac-toe': {
      state = {
        board: Array(9).fill(null),
        marks: { [p1]: roundNumber % 2 === 1 ? 'X' : 'O', [p2]: roundNumber % 2 === 1 ? 'O' : 'X' },
        winningLine: null,
      };
      break;
    }
    case 'rock-paper-scissors': {
      const bestOf = [3, 5, 10].includes(Number(settings.bestOf)) ? Number(settings.bestOf) : 3;
      state = {
        bestOf,
        currentRound: 1,
        history: [],
        lastRoundResult: null,
        phase: 'picking',
      };
      secret = { picks: {} };
      currentTurn = null;
      break;
    }
    case 'connect-4': {
      state = {
        board: Array.from({ length: 6 }, () => Array(7).fill(null)),
        colors: { [p1]: 'red', [p2]: 'yellow' },
        winningCells: null,
        lastMove: null,
      };
      break;
    }
    case 'memory-match': {
      const pairCount = Number(settings.pairCount) === 12 ? 12 : 8;
      const symbolsPool = ['❤️', '🌙', '⭐', '🌸', '🔥', '💎', '🦋', '🎧', '🍓', '🚀', '🎨', '🦊'];
      const chosen = symbolsPool.slice(0, pairCount);
      const deck = [...chosen, ...chosen];
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      state = {
        pairCount,
        flippedIndices: [],
        matchedBy: {},
        moves: { [p1]: 0, [p2]: 0 },
        pairs: { [p1]: 0, [p2]: 0 },
        mismatchPending: false,
        startedAtMs: Date.now(),
      };
      secret = { deck };
      break;
    }
    case 'truth-or-dare': {
      state = {
        category: settings.category || 'All',
        currentPrompt: null,
        usedPrompts: [],
        history: [],
        phase: 'choosing',
      };
      break;
    }
    case 'who-knows-who': {
      const custom = getCustomPrompts('who-knows-who').map((c) => c.content);
      const combined = [...custom, ...WHO_KNOWS_WHO_QUESTIONS];
      const shuffled = combined.sort(() => Math.random() - 0.5).slice(0, 5);
      state = {
        totalRounds: shuffled.length,
        currentRound: 1,
        subjectUserId: p1,
        question: shuffled[0],
        phase: 'answering',
        history: [],
        lastComparison: null,
        compatibility: 0,
      };
      secret = { questions: shuffled, answers: {} };
      currentTurn = null;
      break;
    }
    case 'emoji-guess': {
      const difficulty = settings.difficulty || 'all';
      const pool = EMOJI_PUZZLES.filter((p) => difficulty === 'all' || p.difficulty === difficulty);
      const selected = pool.sort(() => Math.random() - 0.5).slice(0, 5);
      const first = selected[0] || EMOJI_PUZZLES[0];
      state = {
        totalRounds: selected.length,
        currentRound: 1,
        emojis: first.emojis,
        category: first.category,
        difficulty: first.difficulty,
        hintRevealed: false,
        hintText: null,
        roundRevealed: false,
        roundEndsAt: Date.now() + 45000,
        history: [],
        skippedBy: [],
      };
      secret = {
        puzzles: selected,
        answer: first.answer,
        acceptedAnswers: first.acceptedAnswers,
        hint: first.hint,
      };
      currentTurn = null;
      break;
    }
    case 'drawing-guess': {
      const word = DRAWING_WORDS[Math.floor(Math.random() * DRAWING_WORDS.length)];
      state = {
        totalRounds: 4,
        currentRound: 1,
        drawerId: p1,
        wordLength: word.length,
        strokes: [],
        guesses: [],
        roundEndsAt: Date.now() + 75000,
        roundSolvedBy: null,
        roundTimedOut: false,
        history: [],
      };
      secret = { word, usedWords: [word] };
      currentTurn = p1;
      break;
    }
    case 'guess-the-word': {
      const mode: WordMode = settings.mode || 'classic';
      const wordLength = [4, 5, 6, 7].includes(Number(settings.wordLength)) ? Number(settings.wordLength) : 5;
      const category: WordCategory = settings.category || 'General';
      const timedDifficulty = settings.timedDifficulty || 'medium';
      const durationSec = timedDifficulty === 'hard' ? 45 : timedDifficulty === 'easy' ? 120 : 75;

      if (mode === 'custom') {
        const setterId = starter;
        const guesserId = setterId === p1 ? p2 : p1;
        state = {
          mode,
          wordLength,
          category: 'Custom',
          maxAttempts: 6,
          setterId,
          guesserId,
          phase: 'setting_word',
          customHint: '',
          hintsUsed: 0,
          revealedHintIndices: [],
          playerBoards: { [guesserId]: [] },
          finishedPlayers: {},
          endsAt: null,
        };
        secret = { word: '' };
        currentTurn = setterId;
      } else {
        const pool = getWordsByLength(wordLength, mode === 'category' ? category : undefined);
        const activePool = pool.length > 0 ? pool : getWordsByLength(5);
        const word = activePool[Math.floor(Math.random() * activePool.length)] || 'HEART';
        const playerBoards: Record<string, any[]> = {};
        for (const pid of playerIds) playerBoards[pid] = [];
        state = {
          mode,
          wordLength: word.length,
          category: mode === 'category' || mode === 'hint' ? category : 'General',
          maxAttempts: 6,
          phase: 'playing',
          hintsUsed: 0,
          revealedHintIndices: [],
          playerBoards,
          finishedPlayers: {},
          endsAt: mode === 'timed' || mode === 'race' ? Date.now() + durationSec * 1000 : null,
          startedAtMs: Date.now(),
        };
        secret = { word };
        currentTurn = null;
      }
      break;
    }
  }

  db.prepare(
    `INSERT INTO game_sessions (id, room_id, game_id, state_json, secret_state_json, scores_json, current_turn, winner_id, is_draw, status, round_number, started_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 0, 'active', ?, ?)`
  ).run(sessionId, roomId, gameId, JSON.stringify(state), JSON.stringify(secret), JSON.stringify(scores), currentTurn, roundNumber, now);

  db.prepare(`UPDATE rooms SET active_session_id = ?, status = 'playing', updated_at = ? WHERE id = ?`).run(
    sessionId,
    now,
    roomId
  );

  return sessionId;
}

function finalizeSession(
  sessionRow: any,
  state: Record<string, any>,
  scores: Record<string, number>,
  winnerId: string | null,
  isDraw: boolean,
  achievementExtra?: any
): Record<string, any[]> {
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE game_sessions
     SET state_json = ?, scores_json = ?, winner_id = ?, is_draw = ?, status = 'completed', ended_at = ?
     WHERE id = ?`
  ).run(JSON.stringify(state), JSON.stringify(scores), winnerId, isDraw ? 1 : 0, now, sessionRow.id);

  db.prepare(`UPDATE rooms SET status = 'completed', updated_at = ? WHERE id = ?`).run(now, sessionRow.room_id);

  const playerIds = Object.keys(scores);
  const newlyUnlockedByUser: Record<string, any[]> = {};

  for (const pid of playerIds) {
    const outcome = isDraw ? 'draw' : winnerId === pid ? 'win' : 'loss';
    const basePoints = Number(scores[pid] || 0);
    const outcomeBonus = outcome === 'win' ? 25 : outcome === 'draw' ? 10 : 5;
    const totalPoints = Math.max(basePoints, outcomeBonus);

    db.prepare(
      `INSERT OR IGNORE INTO game_scores (id, session_id, user_id, game_id, points, outcome, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(crypto.randomUUID(), sessionRow.id, pid, sessionRow.game_id, totalPoints, outcome, now);

    newlyUnlockedByUser[pid] = evaluateAndUnlockAchievements(pid, {
      gameId: sessionRow.game_id,
      extra: achievementExtra,
    });
  }

  return newlyUnlockedByUser;
}

function evaluateWordleGuess(guess: string, target: string): LetterTileState[] {
  const g = guess.toUpperCase().split('');
  const t = target.toUpperCase().split('');
  const result: LetterTileState[] = Array(t.length).fill('absent');
  const remainingCounts: Record<string, number> = {};

  // Pass 1: exact greens
  for (let i = 0; i < t.length; i++) {
    if (g[i] === t[i]) {
      result[i] = 'correct';
    } else {
      remainingCounts[t[i]] = (remainingCounts[t[i]] || 0) + 1;
    }
  }

  // Pass 2: yellows respecting duplicate counts
  for (let i = 0; i < t.length; i++) {
    if (result[i] === 'correct') continue;
    const ch = g[i];
    if ((remainingCounts[ch] || 0) > 0) {
      result[i] = 'present';
      remainingCounts[ch] -= 1;
    }
  }

  return result;
}

function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

export function processGameMove(
  sessionId: string,
  userId: string,
  moveType: string,
  payload: Record<string, any> = {},
  onAsyncUpdate?: (roomId: string) => void
): SessionEngineResult {
  db.exec('BEGIN IMMEDIATE;');
  try {
    const result = processGameMoveInner(sessionId, userId, moveType, payload, onAsyncUpdate);
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      // ignore rollback error
    }
    throw err;
  }
}

function processGameMoveInner(
  sessionId: string,
  userId: string,
  moveType: string,
  payload: Record<string, any> = {},
  onAsyncUpdate?: (roomId: string) => void
): SessionEngineResult {
  const sessionRow = getSessionRow(sessionId);
  if (!sessionRow) throw new Error('Game session not found');
  if (sessionRow.status !== 'active') {
    if (moveType === 'word:timeout' || moveType === 'emoji:timeout' || moveType === 'draw:timeout') {
      return { sessionId, roomId: sessionRow.room_id, newlyUnlockedByUser: {} };
    }
    throw new Error('Game session has already ended');
  }

  const room = getRoomById(sessionRow.room_id);
  if (!room) throw new Error('Room not found');
  const playerIds = room.players.map((p) => p.userId);
  if (!playerIds.includes(userId)) throw new Error('You are not a player in this room');
  const opponentId = playerIds.find((id) => id !== userId) || userId;

  const state = JSON.parse(sessionRow.state_json || '{}');
  const secret = JSON.parse(sessionRow.secret_state_json || '{}');
  const scores: Record<string, number> = JSON.parse(sessionRow.scores_json || '{}');
  const now = new Date().toISOString();

  // Log move
  db.prepare(
    `INSERT INTO game_moves (id, session_id, user_id, move_type, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(crypto.randomUUID(), sessionId, userId, moveType, JSON.stringify(payload), now);

  let nextTurn = sessionRow.current_turn;
  let roundNumber = sessionRow.round_number;
  let newlyUnlockedByUser: Record<string, any[]> = {};
  let delayedAction: SessionEngineResult['delayedAction'];

  switch (sessionRow.game_id as GameId) {
    case 'tic-tac-toe': {
      if (moveType !== 'ttt:place') throw new Error('Invalid move type');
      if (sessionRow.current_turn !== userId) throw new Error('Not your turn');
      const idx = Number(payload.index);
      if (!Number.isInteger(idx) || idx < 0 || idx > 8) throw new Error('Invalid cell');
      if (state.board[idx] !== null) throw new Error('Cell is already taken');

      state.board[idx] = state.marks[userId];
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
      ];
      let winLine: number[] | null = null;
      for (const line of lines) {
        const [a, b, c] = line;
        if (state.board[a] && state.board[a] === state.board[b] && state.board[a] === state.board[c]) {
          winLine = line;
          break;
        }
      }
      if (winLine) {
        state.winningLine = winLine;
        scores[userId] = (scores[userId] || 0) + 30;
        newlyUnlockedByUser = finalizeSession(sessionRow, state, scores, userId, false);
        return { sessionId, roomId: room.id, newlyUnlockedByUser };
      }
      if (state.board.every((cell: any) => cell !== null)) {
        newlyUnlockedByUser = finalizeSession(sessionRow, state, scores, null, true);
        return { sessionId, roomId: room.id, newlyUnlockedByUser };
      }
      nextTurn = opponentId;
      break;
    }

    case 'rock-paper-scissors': {
      if (moveType === 'rps:pick') {
        if (state.phase !== 'picking') throw new Error('Round already revealed');
        const choice = payload.choice;
        if (!['rock', 'paper', 'scissors'].includes(choice)) throw new Error('Invalid choice');
        secret.picks = secret.picks || {};
        secret.picks[userId] = choice;

        if (playerIds.length === 2 && secret.picks[playerIds[0]] && secret.picks[playerIds[1]]) {
          const pA = playerIds[0];
          const pB = playerIds[1];
          const cA = secret.picks[pA];
          const cB = secret.picks[pB];
          let roundWinner: string | null = null;
          if (cA !== cB) {
            const winsAgainst: Record<string, string> = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
            roundWinner = winsAgainst[cA] === cB ? pA : pB;
          }
          if (roundWinner) {
            scores[roundWinner] = (scores[roundWinner] || 0) + 1;
          }
          const resultObj = {
            round: state.currentRound,
            picks: { [pA]: cA, [pB]: cB },
            winnerId: roundWinner,
          };
          state.history = [...(state.history || []), resultObj];
          state.lastRoundResult = resultObj;
          state.phase = 'revealed';

          const winsNeeded = Math.ceil((state.bestOf || 3) / 2);
          if ((scores[pA] || 0) >= winsNeeded || (scores[pB] || 0) >= winsNeeded) {
            const matchWinner = (scores[pA] || 0) >= winsNeeded ? pA : pB;
            const finalScores = {
              [pA]: (scores[pA] || 0) * 15,
              [pB]: (scores[pB] || 0) * 15,
            };
            state.roundWins = { ...scores };
            newlyUnlockedByUser = finalizeSession(sessionRow, state, finalScores, matchWinner, false);
            return { sessionId, roomId: room.id, newlyUnlockedByUser };
          }
        }
      } else if (moveType === 'rps:next_round') {
        if (state.phase !== 'revealed') throw new Error('Not ready for next round');
        secret.picks = {};
        state.currentRound += 1;
        state.phase = 'picking';
        roundNumber = state.currentRound;
      } else {
        throw new Error('Invalid RPS move');
      }
      break;
    }

    case 'connect-4': {
      if (moveType !== 'c4:drop') throw new Error('Invalid Connect 4 move');
      if (sessionRow.current_turn !== userId) throw new Error('Not your turn');
      const col = Number(payload.col);
      if (!Number.isInteger(col) || col < 0 || col > 6) throw new Error('Invalid column');

      let placedRow = -1;
      for (let r = 5; r >= 0; r--) {
        if (state.board[r][col] === null) {
          placedRow = r;
          break;
        }
      }
      if (placedRow === -1) throw new Error('Column is full');
      const color = state.colors[userId];
      state.board[placedRow][col] = color;
      state.lastMove = { row: placedRow, col, color };

      // Check 4-in-a-row
      const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
      let winCells: Array<[number, number]> | null = null;
      for (const [dr, dc] of dirs) {
        const line: Array<[number, number]> = [[placedRow, col]];
        for (const sign of [1, -1]) {
          let r = placedRow + dr * sign;
          let c = col + dc * sign;
          while (r >= 0 && r < 6 && c >= 0 && c < 7 && state.board[r][c] === color) {
            line.push([r, c]);
            r += dr * sign;
            c += dc * sign;
          }
        }
        if (line.length >= 4) {
          winCells = line;
          break;
        }
      }
      if (winCells) {
        state.winningCells = winCells;
        scores[userId] = (scores[userId] || 0) + 40;
        newlyUnlockedByUser = finalizeSession(sessionRow, state, scores, userId, false);
        return { sessionId, roomId: room.id, newlyUnlockedByUser };
      }
      if (state.board[0].every((cell: any) => cell !== null)) {
        newlyUnlockedByUser = finalizeSession(sessionRow, state, scores, null, true);
        return { sessionId, roomId: room.id, newlyUnlockedByUser };
      }
      nextTurn = opponentId;
      break;
    }

    case 'memory-match': {
      if (moveType !== 'memory:flip') throw new Error('Invalid Memory Match move');
      if (sessionRow.current_turn !== userId) throw new Error('Not your turn');
      if (state.mismatchPending) throw new Error('Wait for cards to flip back');
      const index = Number(payload.index);
      const deck: string[] = secret.deck || [];
      if (!Number.isInteger(index) || index < 0 || index >= deck.length) throw new Error('Invalid card index');
      if (state.matchedBy[index]) throw new Error('Card already matched');
      if ((state.flippedIndices || []).includes(index)) throw new Error('Card already flipped');

      state.flippedIndices = [...(state.flippedIndices || []), index];
      if (state.flippedIndices.length === 2) {
        state.moves[userId] = (state.moves[userId] || 0) + 1;
        const [i1, i2] = state.flippedIndices;
        if (deck[i1] === deck[i2]) {
          state.matchedBy[i1] = userId;
          state.matchedBy[i2] = userId;
          state.pairs[userId] = (state.pairs[userId] || 0) + 1;
          scores[userId] = state.pairs[userId] * 15;
          state.flippedIndices = [];

          if (Object.keys(state.matchedBy).length === deck.length) {
            state.elapsedSeconds = Math.round((Date.now() - state.startedAtMs) / 1000);
            const p1Pairs = state.pairs[playerIds[0]] || 0;
            const p2Pairs = state.pairs[playerIds[1]] || 0;
            const isDraw = p1Pairs === p2Pairs;
            const winner = isDraw ? null : p1Pairs > p2Pairs ? playerIds[0] : playerIds[1];
            newlyUnlockedByUser = finalizeSession(sessionRow, state, scores, winner, isDraw, {
              winnerPairs: Math.max(p1Pairs, p2Pairs),
            });
            return { sessionId, roomId: room.id, newlyUnlockedByUser };
          }
          // Keep turn on match
        } else {
          state.mismatchPending = true;
          delayedAction = {
            delayMs: 950,
            fn: () => {
              const latest = getSessionRow(sessionId);
              if (!latest || latest.status !== 'active') return;
              const st = JSON.parse(latest.state_json || '{}');
              st.flippedIndices = [];
              st.mismatchPending = false;
              db.prepare('UPDATE game_sessions SET state_json = ?, current_turn = ? WHERE id = ?').run(
                JSON.stringify(st),
                opponentId,
                sessionId
              );
              onAsyncUpdate?.(room.id);
            },
          };
        }
      }
      break;
    }

    case 'truth-or-dare': {
      if (moveType === 'tod:draw') {
        if (sessionRow.current_turn !== userId) throw new Error('Not your turn');
        const choiceType = payload.type === 'dare' ? 'dare' : 'truth';
        const cat = payload.category || state.category || 'All';
        const custom = getCustomPrompts('truth-or-dare').map((c) => ({
          category: c.category,
          type: c.promptType as 'truth' | 'dare',
          text: c.content,
        }));
        const fullDeck = [...custom, ...TRUTH_OR_DARE_DECK];
        let candidates = fullDeck.filter(
          (item) =>
            item.type === choiceType &&
            (cat === 'All' || item.category === cat) &&
            !(state.usedPrompts || []).includes(item.text)
        );
        if (candidates.length === 0) {
          candidates = fullDeck.filter((item) => item.type === choiceType);
        }
        const picked = candidates[Math.floor(Math.random() * candidates.length)] || fullDeck[0];
        state.category = cat;
        state.currentPrompt = { ...picked, forUserId: userId };
        state.usedPrompts = [...(state.usedPrompts || []), picked.text];
        state.phase = 'responding';
      } else if (moveType === 'tod:complete' || moveType === 'tod:skip') {
        if (!state.currentPrompt) throw new Error('No active prompt');
        const completed = moveType === 'tod:complete';
        if (completed) {
          scores[state.currentPrompt.forUserId] = (scores[state.currentPrompt.forUserId] || 0) + 10;
        }
        state.history = [
          ...(state.history || []),
          { ...state.currentPrompt, completed, round: roundNumber },
        ];
        state.currentPrompt = null;
        state.phase = 'choosing';
        roundNumber += 1;
        nextTurn = opponentId;
      } else if (moveType === 'tod:end') {
        const p1 = playerIds[0];
        const p2 = playerIds[1] || p1;
        const s1 = scores[p1] || 0;
        const s2 = scores[p2] || 0;
        const isDraw = s1 === s2;
        const winner = isDraw ? null : s1 > s2 ? p1 : p2;
        newlyUnlockedByUser = finalizeSession(sessionRow, state, scores, winner, isDraw);
        return { sessionId, roomId: room.id, newlyUnlockedByUser };
      } else {
        throw new Error('Invalid Truth or Dare move');
      }
      break;
    }

    case 'who-knows-who': {
      if (moveType === 'wkw:submit') {
        if (state.phase !== 'answering') throw new Error('Wait for next question');
        const answerText = String(payload.answer || '').trim();
        if (!answerText) throw new Error('Answer cannot be empty');
        secret.answers = secret.answers || {};
        secret.answers[userId] = answerText;

        if (playerIds.length === 2 && secret.answers[playerIds[0]] && secret.answers[playerIds[1]]) {
          const a1 = normalizeText(secret.answers[playerIds[0]]);
          const a2 = normalizeText(secret.answers[playerIds[1]]);
          const autoMatched = a1 === a2 || (a1.length >= 3 && a2.includes(a1)) || (a2.length >= 3 && a1.includes(a2));
          if (autoMatched) {
            scores[playerIds[0]] = (scores[playerIds[0]] || 0) + 20;
            scores[playerIds[1]] = (scores[playerIds[1]] || 0) + 20;
          }
          const comparison = {
            round: state.currentRound,
            subjectUserId: state.subjectUserId,
            question: state.question,
            answers: { ...secret.answers },
            matched: autoMatched,
          };
          state.lastComparison = comparison;
          state.history = [...(state.history || []), comparison];
          const matchesCount = state.history.filter((h: any) => h.matched).length;
          state.compatibility = Math.round((matchesCount / state.history.length) * 100);
          state.phase = 'revealed';
        }
      } else if (moveType === 'wkw:override_match') {
        if (state.phase !== 'revealed' || !state.lastComparison) throw new Error('Nothing to confirm');
        if (!state.lastComparison.matched) {
          state.lastComparison.matched = true;
          state.history[state.history.length - 1].matched = true;
          scores[playerIds[0]] = (scores[playerIds[0]] || 0) + 20;
          scores[playerIds[1]] = (scores[playerIds[1]] || 0) + 20;
          const matchesCount = state.history.filter((h: any) => h.matched).length;
          state.compatibility = Math.round((matchesCount / state.history.length) * 100);
        }
      } else if (moveType === 'wkw:next') {
        if (state.phase !== 'revealed') throw new Error('Reveal answers first');
        if (state.currentRound >= state.totalRounds) {
          const compat = state.compatibility || 0;
          newlyUnlockedByUser = finalizeSession(sessionRow, state, scores, null, true, {
            compatibility: compat,
          });
          return { sessionId, roomId: room.id, newlyUnlockedByUser };
        }
        state.currentRound += 1;
        roundNumber = state.currentRound;
        state.subjectUserId = state.subjectUserId === playerIds[0] ? playerIds[1] || playerIds[0] : playerIds[0];
        state.question = secret.questions[state.currentRound - 1];
        state.phase = 'answering';
        state.lastComparison = null;
        secret.answers = {};
      } else {
        throw new Error('Invalid Who Knows Who move');
      }
      break;
    }

    case 'emoji-guess': {
      if (moveType === 'emoji:hint') {
        state.hintRevealed = true;
        state.hintText = secret.hint;
      } else if (moveType === 'emoji:guess') {
        if (state.roundRevealed) throw new Error('Round already solved');
        const guess = normalizeText(String(payload.guess || ''));
        const accepted: string[] = (secret.acceptedAnswers || []).map(normalizeText);
        if (guess && (accepted.includes(guess) || guess === normalizeText(secret.answer))) {
          const pts = state.hintRevealed ? 12 : 20;
          scores[userId] = (scores[userId] || 0) + pts;
          state.roundRevealed = true;
          state.solvedBy = userId;
          state.history = [
            ...(state.history || []),
            { round: state.currentRound, emojis: state.emojis, answer: secret.answer, solvedBy: userId },
          ];
        } else {
          state.lastWrongGuess = { userId, guess: String(payload.guess || ''), at: Date.now() };
        }
      } else if (moveType === 'emoji:skip' || moveType === 'emoji:timeout') {
        if (!state.roundRevealed) {
          state.roundRevealed = true;
          state.solvedBy = null;
          state.history = [
            ...(state.history || []),
            { round: state.currentRound, emojis: state.emojis, answer: secret.answer, solvedBy: null },
          ];
        }
      } else if (moveType === 'emoji:next') {
        if (!state.roundRevealed) throw new Error('Finish current round first');
        if (state.currentRound >= state.totalRounds) {
          const p1 = playerIds[0];
          const p2 = playerIds[1] || p1;
          const isDraw = (scores[p1] || 0) === (scores[p2] || 0);
          const winner = isDraw ? null : (scores[p1] || 0) > (scores[p2] || 0) ? p1 : p2;
          newlyUnlockedByUser = finalizeSession(sessionRow, state, scores, winner, isDraw);
          return { sessionId, roomId: room.id, newlyUnlockedByUser };
        }
        state.currentRound += 1;
        roundNumber = state.currentRound;
        const nextPuzzle = secret.puzzles[state.currentRound - 1];
        state.emojis = nextPuzzle.emojis;
        state.category = nextPuzzle.category;
        state.difficulty = nextPuzzle.difficulty;
        state.hintRevealed = false;
        state.hintText = null;
        state.roundRevealed = false;
        state.solvedBy = null;
        state.roundEndsAt = Date.now() + 45000;
        secret.answer = nextPuzzle.answer;
        secret.acceptedAnswers = nextPuzzle.acceptedAnswers;
        secret.hint = nextPuzzle.hint;
      } else {
        throw new Error('Invalid Emoji Guess move');
      }
      break;
    }

    case 'drawing-guess': {
      if (moveType === 'draw:stroke') {
        if (state.drawerId !== userId) throw new Error('Only the drawer can draw');
        if (state.roundSolvedBy || state.roundTimedOut) throw new Error('Round finished');
        state.strokes = [...(state.strokes || []), payload.stroke];
      } else if (moveType === 'draw:clear') {
        if (state.drawerId !== userId) throw new Error('Only the drawer can clear');
        state.strokes = [];
      } else if (moveType === 'draw:undo') {
        if (state.drawerId !== userId) throw new Error('Only the drawer can undo');
        state.strokes = (state.strokes || []).slice(0, -1);
      } else if (moveType === 'draw:guess') {
        if (state.drawerId === userId) throw new Error('Drawer cannot guess');
        if (state.roundSolvedBy || state.roundTimedOut) throw new Error('Round already finished');
        const text = String(payload.guess || '').trim();
        if (!text) throw new Error('Guess cannot be empty');
        const isCorrect = normalizeText(text) === normalizeText(secret.word);
        state.guesses = [
          ...(state.guesses || []),
          { id: crypto.randomUUID(), userId, text: isCorrect ? 'Guessed the word!' : text, isCorrect, at: Date.now() },
        ];
        if (isCorrect) {
          state.roundSolvedBy = userId;
          scores[userId] = (scores[userId] || 0) + 25;
          scores[state.drawerId] = (scores[state.drawerId] || 0) + 15;
          state.history = [
            ...(state.history || []),
            { round: state.currentRound, word: secret.word, drawerId: state.drawerId, solvedBy: userId },
          ];
        }
      } else if (moveType === 'draw:timeout') {
        if (!state.roundSolvedBy && !state.roundTimedOut) {
          state.roundTimedOut = true;
          state.history = [
            ...(state.history || []),
            { round: state.currentRound, word: secret.word, drawerId: state.drawerId, solvedBy: null },
          ];
        }
      } else if (moveType === 'draw:next') {
        if (!state.roundSolvedBy && !state.roundTimedOut) throw new Error('Finish current drawing round first');
        if (state.currentRound >= state.totalRounds) {
          const p1 = playerIds[0];
          const p2 = playerIds[1] || p1;
          const isDraw = (scores[p1] || 0) === (scores[p2] || 0);
          const winner = isDraw ? null : (scores[p1] || 0) > (scores[p2] || 0) ? p1 : p2;
          newlyUnlockedByUser = finalizeSession(sessionRow, state, scores, winner, isDraw);
          return { sessionId, roomId: room.id, newlyUnlockedByUser };
        }
        state.currentRound += 1;
        roundNumber = state.currentRound;
        const nextDrawer = state.drawerId === playerIds[0] ? playerIds[1] || playerIds[0] : playerIds[0];
        const unused = DRAWING_WORDS.filter((w) => !(secret.usedWords || []).includes(w));
        const pool = unused.length > 0 ? unused : DRAWING_WORDS;
        const nextWord = pool[Math.floor(Math.random() * pool.length)];
        secret.word = nextWord;
        secret.usedWords = [...(secret.usedWords || []), nextWord];
        state.drawerId = nextDrawer;
        state.wordLength = nextWord.length;
        state.strokes = [];
        state.guesses = [];
        state.roundSolvedBy = null;
        state.roundTimedOut = false;
        state.roundEndsAt = Date.now() + 75000;
        nextTurn = nextDrawer;
      } else {
        throw new Error('Invalid Drawing move');
      }
      break;
    }

    case 'guess-the-word': {
      if (moveType === 'word:set_custom') {
        if (state.mode !== 'custom' || state.phase !== 'setting_word') throw new Error('Not setting custom word');
        if (state.setterId !== userId) throw new Error('Only the setter can set the secret word');
        const customWord = String(payload.word || '').toUpperCase().trim();
        if (!/^[A-Z]{4,7}$/.test(customWord)) {
          throw new Error('Custom word must be 4 to 7 letters (A-Z only)');
        }
        secret.word = customWord;
        state.wordLength = customWord.length;
        state.customHint = String(payload.hint || '').trim().slice(0, 120);
        state.phase = 'playing';
        state.startedAtMs = Date.now();
        nextTurn = state.guesserId;
      } else if (moveType === 'word:hint') {
        if (state.phase !== 'playing') throw new Error('Game not in playing phase');
        if ((state.hintsUsed || 0) >= 2) throw new Error('Maximum hints used');
        const target = secret.word;
        const unrevealed: number[] = [];
        for (let i = 0; i < target.length; i++) {
          if (!(state.revealedHintIndices || []).includes(i)) unrevealed.push(i);
        }
        if (unrevealed.length > 0) {
          const pickIdx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
          state.revealedHintIndices = [...(state.revealedHintIndices || []), pickIdx];
          state.hintsUsed = (state.hintsUsed || 0) + 1;
        }
      } else if (moveType === 'word:guess') {
        if (state.phase !== 'playing') throw new Error('Not in playing phase');
        if (state.mode === 'custom' && userId === state.setterId) {
          throw new Error('Word creator watches the guesser solve');
        }
        if (state.finishedPlayers?.[userId]) throw new Error('You have already finished this board');

        const guess = String(payload.guess || '').toUpperCase().trim();
        const target = String(secret.word || '').toUpperCase();
        if (guess.length !== target.length) throw new Error(`Word must be ${target.length} letters`);
        if (!isValidDictionaryWord(guess, target)) {
          throw new Error(`"${guess}" is not in the word dictionary`);
        }

        const feedback = evaluateWordleGuess(guess, target);
        const rows = state.playerBoards[userId] || [];
        rows.push({ guess, feedback, submittedAt: now });
        state.playerBoards[userId] = rows;

        const solved = guess === target;
        const outOfAttempts = rows.length >= (state.maxAttempts || 6);

        if (solved) {
          const attemptScore = (7 - rows.length) * 15;
          const speedBonus = state.endsAt ? Math.max(0, Math.round((state.endsAt - Date.now()) / 2000)) : 0;
          const hintPenalty = (state.hintsUsed || 0) * 5;
          scores[userId] = Math.max(15, attemptScore + speedBonus - hintPenalty);
          state.finishedPlayers[userId] = { solved: true, attempts: rows.length, at: Date.now() };
        } else if (outOfAttempts) {
          state.finishedPlayers[userId] = { solved: false, attempts: rows.length, at: Date.now() };
        }

        // Check match completion conditions
        if (state.mode === 'custom') {
          if (state.finishedPlayers[state.guesserId]) {
            const won = state.finishedPlayers[state.guesserId].solved;
            const winner = won ? state.guesserId : state.setterId;
            if (!won) scores[state.setterId] = 25;
            newlyUnlockedByUser = finalizeSession(sessionRow, state, scores, winner, false);
            return { sessionId, roomId: room.id, newlyUnlockedByUser };
          }
        } else if (state.mode === 'race' && solved) {
          // First to solve wins Race Mode immediately!
          scores[userId] += 20;
          newlyUnlockedByUser = finalizeSession(sessionRow, state, scores, userId, false);
          return { sessionId, roomId: room.id, newlyUnlockedByUser };
        } else {
          const allFinished = playerIds.every((pid) => Boolean(state.finishedPlayers[pid]));
          if (allFinished) {
            const p1 = playerIds[0];
            const p2 = playerIds[1] || p1;
            const f1 = state.finishedPlayers[p1];
            const f2 = state.finishedPlayers[p2];
            let winner: string | null = null;
            let isDraw = false;
            if (f1.solved && !f2.solved) winner = p1;
            else if (f2.solved && !f1.solved) winner = p2;
            else if (f1.solved && f2.solved) {
              if (f1.attempts < f2.attempts) winner = p1;
              else if (f2.attempts < f1.attempts) winner = p2;
              else isDraw = true;
            } else {
              isDraw = true;
            }
            newlyUnlockedByUser = finalizeSession(sessionRow, state, scores, winner, isDraw);
            return { sessionId, roomId: room.id, newlyUnlockedByUser };
          }
        }
      } else if (moveType === 'word:timeout') {
        if (state.phase === 'playing') {
          const p1 = playerIds[0];
          const p2 = playerIds[1] || p1;
          const s1 = scores[p1] || 0;
          const s2 = scores[p2] || 0;
          const isDraw = s1 === s2;
          const winner = isDraw ? null : s1 > s2 ? p1 : p2;
          newlyUnlockedByUser = finalizeSession(sessionRow, state, scores, winner, isDraw);
          return { sessionId, roomId: room.id, newlyUnlockedByUser };
        }
      } else {
        throw new Error('Invalid Guess The Word move');
      }
      break;
    }
  }

  db.prepare(
    `UPDATE game_sessions
     SET state_json = ?, secret_state_json = ?, scores_json = ?, current_turn = ?, round_number = ?
     WHERE id = ?`
  ).run(JSON.stringify(state), JSON.stringify(secret), JSON.stringify(scores), nextTurn, roundNumber, sessionId);

  return { sessionId, roomId: room.id, newlyUnlockedByUser, delayedAction };
}
