import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import type {
  AchievementItem,
  ChatMessage,
  CustomPromptItem,
  GameCatalogItem,
  GameId,
  MemoryItem,
  NotificationItem,
  PlayerStats,
  RecentActivityItem,
  Room,
  RoomPlayer,
  UserProfile,
} from '../src/types/rsverse';

const DATA_DIR = path.resolve(process.cwd(), 'data');
export const UPLOADS_DIR = process.env.RSVERSE_UPLOADS_DIR
  ? path.resolve(process.env.RSVERSE_UPLOADS_DIR)
  : path.join(DATA_DIR, 'uploads');
const DB_PATH = process.env.RSVERSE_DB_PATH
  ? path.resolve(process.env.RSVERSE_DB_PATH)
  : path.join(DATA_DIR, 'rsverse.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA busy_timeout = 5000;');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS authorized_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('creator', 'partner')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('creator', 'partner')),
      avatar_url TEXT NOT NULL,
      bio TEXT NOT NULL DEFAULT '',
      is_online INTEGER NOT NULL DEFAULT 0,
      last_seen TEXT NOT NULL,
      theme_preference TEXT NOT NULL DEFAULT 'dark' CHECK (theme_preference IN ('dark', 'light')),
      sound_enabled INTEGER NOT NULL DEFAULT 1,
      music_enabled INTEGER NOT NULL DEFAULT 0,
      notifications_enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      accent_color TEXT NOT NULL,
      estimated_minutes TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      invite_code TEXT UNIQUE NOT NULL,
      host_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      selected_game_id TEXT REFERENCES games(id),
      status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'ready', 'playing', 'completed', 'expired')),
      settings_json TEXT NOT NULL DEFAULT '{}',
      active_session_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_rooms_invite_code ON rooms(invite_code);
    CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

    CREATE TABLE IF NOT EXISTS room_players (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      is_ready INTEGER NOT NULL DEFAULT 0,
      is_connected INTEGER NOT NULL DEFAULT 1,
      joined_at TEXT NOT NULL,
      UNIQUE (room_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_room_players_user ON room_players(user_id);

    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      game_id TEXT NOT NULL REFERENCES games(id),
      state_json TEXT NOT NULL DEFAULT '{}',
      secret_state_json TEXT NOT NULL DEFAULT '{}',
      scores_json TEXT NOT NULL DEFAULT '{}',
      current_turn TEXT REFERENCES profiles(id),
      winner_id TEXT REFERENCES profiles(id),
      is_draw INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
      round_number INTEGER NOT NULL DEFAULT 1,
      started_at TEXT NOT NULL,
      ended_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_game_sessions_room ON game_sessions(room_id);

    CREATE TABLE IF NOT EXISTS game_moves (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      move_type TEXT NOT NULL,
      payload_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_game_moves_session ON game_moves(session_id, created_at);

    CREATE TABLE IF NOT EXISTS game_scores (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      game_id TEXT NOT NULL REFERENCES games(id),
      points INTEGER NOT NULL DEFAULT 0,
      outcome TEXT NOT NULL CHECK (outcome IN ('win', 'loss', 'draw')),
      created_at TEXT NOT NULL
    );

    DELETE FROM game_scores
    WHERE rowid NOT IN (
      SELECT MIN(rowid) FROM game_scores GROUP BY session_id, user_id
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_game_scores_session_user ON game_scores(session_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_game_scores_session ON game_scores(session_id);
    CREATE INDEX IF NOT EXISTS idx_game_scores_user ON game_scores(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'emoji', 'system')),
      read_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      caption TEXT NOT NULL DEFAULT '',
      personal_note TEXT NOT NULL DEFAULT '',
      special_date TEXT NOT NULL,
      image_url TEXT NOT NULL,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_memories_date ON memories(special_date DESC);

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 50
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
      unlocked_at TEXT NOT NULL,
      UNIQUE (user_id, achievement_id)
    );

    CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

    CREATE TABLE IF NOT EXISTS custom_prompts (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL CHECK (game_id IN ('truth-or-dare', 'who-knows-who')),
      category TEXT NOT NULL,
      prompt_type TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );
  `);

  seedGamesAndAchievements();
}

function seedGamesAndAchievements(): void {
  const games: GameCatalogItem[] = [
    {
      id: 'tic-tac-toe',
      slug: 'tic-tac-toe',
      name: 'Tic Tac Toe',
      category: 'Classic',
      description: 'Tactical 3x3 duel with alternating X/O turns, live round tracking, and instant rematches.',
      accentColor: '#F43F5E',
      estimatedMinutes: '2 min',
    },
    {
      id: 'rock-paper-scissors',
      slug: 'rock-paper-scissors',
      name: 'Rock Paper Scissors',
      category: 'Classic',
      description: 'Secret simultaneous picks hidden until both players lock in across Best of 3, 5, or 10.',
      accentColor: '#8B5CF6',
      estimatedMinutes: '3 min',
    },
    {
      id: 'connect-4',
      slug: 'connect-4',
      name: 'Connect 4',
      category: 'Strategy',
      description: 'Drop crimson and amber discs down a 7x6 vertical grid to link four horizontally, vertically, or diagonally.',
      accentColor: '#3B82F6',
      estimatedMinutes: '5 min',
    },
    {
      id: 'memory-match',
      slug: 'memory-match',
      name: 'Memory Match',
      category: 'Strategy',
      description: 'Turn-based card flipping showdown tracking matched pairs, move precision, and elapsed time.',
      accentColor: '#10B981',
      estimatedMinutes: '4 min',
    },
    {
      id: 'truth-or-dare',
      slug: 'truth-or-dare',
      name: 'Truth or Dare',
      category: 'Party',
      description: 'Curated romantic, funny, deep, and challenging prompts plus custom questions you write together.',
      accentColor: '#EC4899',
      estimatedMinutes: '10 min',
    },
    {
      id: 'who-knows-who',
      slug: 'who-knows-who',
      name: 'Who Knows Who Better?',
      category: 'Party',
      description: 'Secretly answer questions about each other, reveal side-by-side, and compute your compatibility score.',
      accentColor: '#A855F7',
      estimatedMinutes: '8 min',
    },
    {
      id: 'emoji-guess',
      slug: 'emoji-guess',
      name: 'Emoji Guess',
      category: 'Party',
      description: 'Decode curated emoji clues for movies, anime, songs, characters, and phrases before the timer runs out.',
      accentColor: '#F59E0B',
      estimatedMinutes: '5 min',
    },
    {
      id: 'drawing-guess',
      slug: 'drawing-guess',
      name: 'Drawing & Guessing',
      category: 'Creative',
      description: 'Live synchronized canvas strokes with color palettes, countdown timer, and instant guess checking.',
      accentColor: '#06B6D4',
      estimatedMinutes: '6 min',
    },
    {
      id: 'guess-the-word',
      slug: 'guess-the-word',
      name: 'Guess The Word',
      category: 'Word',
      description: 'Six-mode Wordle-inspired multiplayer duel: Classic, Race, Timed, Hint, Category, and Custom Secret Words.',
      accentColor: '#6366F1',
      estimatedMinutes: '5 min',
    },
  ];

  const insertGame = db.prepare(`
    INSERT INTO games (id, slug, name, category, description, accent_color, estimated_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      description = excluded.description,
      accent_color = excluded.accent_color,
      estimated_minutes = excluded.estimated_minutes
  `);
  for (const g of games) {
    insertGame.run(g.id, g.slug, g.name, g.category, g.description, g.accentColor, g.estimatedMinutes);
  }

  const achievements = [
    { id: 'first-victory', title: 'First Victory', description: 'Win your very first multiplayer match in RSverse.', icon: 'Trophy', points: 50 },
    { id: 'gaming-champion', title: 'Gaming Champion', description: 'Reach 10 total victories across any games.', icon: 'Crown', points: 200 },
    { id: 'word-master', title: 'Word Master', description: 'Win 3 matches of Guess The Word.', icon: 'BookOpen', points: 120 },
    { id: 'perfect-match', title: 'Perfect Match', description: 'Score 80%+ compatibility in Who Knows Who Better?', icon: 'Heart', points: 150 },
    { id: 'unbeatable', title: 'Unbeatable', description: 'Achieve a 5-match winning streak.', icon: 'Flame', points: 250 },
    { id: 'memory-master', title: 'Memory Master', description: 'Win a game of Memory Match with 8 or more pairs.', icon: 'Brain', points: 100 },
    { id: 'daily-player', title: 'Daily Player', description: 'Play matches on at least 2 distinct calendar days or 5+ total matches.', icon: 'Calendar', points: 100 },
  ];

  const insertAch = db.prepare(`
    INSERT INTO achievements (id, title, description, icon, points)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      icon = excluded.icon,
      points = excluded.points
  `);
  for (const a of achievements) {
    insertAch.run(a.id, a.title, a.description, a.icon, a.points);
  }
}

export function mapProfileRow(row: any): UserProfile {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    role: row.role,
    avatarUrl: row.avatar_url,
    bio: row.bio || '',
    isOnline: Boolean(row.is_online),
    lastSeen: row.last_seen,
    themePreference: row.theme_preference === 'light' ? 'light' : 'dark',
    soundEnabled: Boolean(row.sound_enabled),
    musicEnabled: Boolean(row.music_enabled),
    notificationsEnabled: Boolean(row.notifications_enabled),
    createdAt: row.created_at,
  };
}

export function getRoomById(roomId: string): Room | null {
  const row = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId) as any;
  if (!row) return null;
  const playersRows = db
    .prepare(
      `SELECT rp.*, p.username, p.avatar_url, p.is_online, p.role
       FROM room_players rp
       JOIN profiles p ON p.id = rp.user_id
       WHERE rp.room_id = ?
       ORDER BY rp.joined_at ASC`
    )
    .all(roomId) as any[];

  const players: RoomPlayer[] = playersRows.map((p) => ({
    userId: p.user_id,
    username: p.username,
    avatarUrl: p.avatar_url,
    isOnline: Boolean(p.is_online),
    isReady: Boolean(p.is_ready),
    isConnected: Boolean(p.is_connected),
    role: p.role,
  }));

  return {
    id: row.id,
    inviteCode: row.invite_code,
    hostId: row.host_id,
    selectedGameId: row.selected_game_id,
    status: row.status,
    settings: JSON.parse(row.settings_json || '{}'),
    players,
    activeSessionId: row.active_session_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getAllGames(): GameCatalogItem[] {
  const rows = db.prepare('SELECT * FROM games').all() as any[];
  return rows.map((r) => ({
    id: r.id as GameId,
    slug: r.slug,
    name: r.name,
    category: r.category,
    description: r.description,
    accentColor: r.accent_color,
    estimatedMinutes: r.estimated_minutes,
  }));
}

export function computePlayerStats(userId: string): PlayerStats | null {
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(userId) as any;
  if (!profile) return null;

  const scores = db
    .prepare('SELECT * FROM game_scores WHERE user_id = ? ORDER BY created_at ASC')
    .all(userId) as any[];

  let wins = 0;
  let losses = 0;
  let draws = 0;
  let totalPoints = 0;
  let currentStreak = 0;
  let highestStreak = 0;
  const gameCounts: Record<string, number> = {};

  for (const s of scores) {
    totalPoints += Number(s.points || 0);
    gameCounts[s.game_id] = (gameCounts[s.game_id] || 0) + 1;
    if (s.outcome === 'win') {
      wins++;
      currentStreak++;
      if (currentStreak > highestStreak) highestStreak = currentStreak;
    } else if (s.outcome === 'loss') {
      losses++;
      currentStreak = 0;
    } else {
      draws++;
    }
  }

  // Add achievement bonus points
  const achPointsRow = db
    .prepare(
      `SELECT COALESCE(SUM(a.points), 0) as bonus
       FROM user_achievements ua
       JOIN achievements a ON a.id = ua.achievement_id
       WHERE ua.user_id = ?`
    )
    .get(userId) as any;
  totalPoints += Number(achPointsRow?.bonus || 0);

  let favoriteGame: string | null = null;
  let maxCount = 0;
  for (const [gId, count] of Object.entries(gameCounts)) {
    if (count > maxCount) {
      maxCount = count;
      const g = db.prepare('SELECT name FROM games WHERE id = ?').get(gId) as any;
      favoriteGame = g?.name || gId;
    }
  }

  const totalMatches = scores.length;
  const winPercentage = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

  return {
    userId: profile.id,
    username: profile.username,
    avatarUrl: profile.avatar_url,
    isOnline: Boolean(profile.is_online),
    totalMatches,
    wins,
    losses,
    draws,
    winPercentage,
    currentStreak,
    highestStreak,
    favoriteGame,
    totalPoints,
  };
}

export function getLeaderboard(): PlayerStats[] {
  const profiles = db.prepare('SELECT id FROM profiles ORDER BY created_at ASC').all() as any[];
  return profiles
    .map((p) => computePlayerStats(p.id))
    .filter((s): s is PlayerStats => s !== null)
    .sort((a, b) => b.totalPoints - a.totalPoints || b.wins - a.wins);
}

export function getRecentActivities(limit = 10): RecentActivityItem[] {
  const rows = db
    .prepare(
      `SELECT gs.id, gs.game_id, g.name as game_name, p.username as winner_username, gs.is_draw, gs.ended_at
       FROM game_sessions gs
       JOIN games g ON g.id = gs.game_id
       LEFT JOIN profiles p ON p.id = gs.winner_id
       WHERE gs.status = 'completed' AND gs.ended_at IS NOT NULL
       ORDER BY gs.ended_at DESC
       LIMIT ?`
    )
    .all(limit) as any[];

  return rows.map((r) => ({
    id: r.id,
    gameId: r.game_id,
    gameName: r.game_name,
    winnerUsername: r.winner_username || null,
    isDraw: Boolean(r.is_draw),
    endedAt: r.ended_at,
    summary: r.is_draw
      ? `${r.game_name} ended in a draw`
      : r.winner_username
      ? `${r.winner_username} won in ${r.game_name}`
      : `${r.game_name} match completed`,
  }));
}

export function getAchievementsWithStatus(): AchievementItem[] {
  const achs = db.prepare('SELECT * FROM achievements').all() as any[];
  const unlocked = db.prepare('SELECT * FROM user_achievements').all() as any[];
  return achs.map((a) => {
    const matches = unlocked.filter((u) => u.achievement_id === a.id);
    const unlockedAtMap: Record<string, string> = {};
    for (const m of matches) unlockedAtMap[m.user_id] = m.unlocked_at;
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      points: a.points,
      unlockedByUserIds: matches.map((m) => m.user_id),
      unlockedAtMap,
    };
  });
}

export function createNotification(userId: string, type: string, title: string, body: string): NotificationItem {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, body, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`
  ).run(id, userId, type, title, body, createdAt);
  return { id, userId, type, title, body, isRead: false, createdAt };
}

export function evaluateAndUnlockAchievements(userId: string, context?: { gameId?: GameId; extra?: any }): AchievementItem[] {
  const stats = computePlayerStats(userId);
  if (!stats) return [];

  const unlockedNow: string[] = [];
  const checkAndGrant = (achId: string) => {
    const existing = db
      .prepare('SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?')
      .get(userId, achId);
    if (!existing) {
      db.prepare('INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at) VALUES (?, ?, ?, ?)').run(
        crypto.randomUUID(),
        userId,
        achId,
        new Date().toISOString()
      );
      unlockedNow.push(achId);
    }
  };

  if (stats.wins >= 1) checkAndGrant('first-victory');
  if (stats.wins >= 10) checkAndGrant('gaming-champion');
  if (stats.highestStreak >= 5) checkAndGrant('unbeatable');

  const wordWins = db
    .prepare("SELECT COUNT(*) as c FROM game_scores WHERE user_id = ? AND game_id = 'guess-the-word' AND outcome = 'win'")
    .get(userId) as any;
  if (Number(wordWins?.c || 0) >= 3) checkAndGrant('word-master');

  if (context?.gameId === 'who-knows-who' && Number(context.extra?.compatibility || 0) >= 80) {
    checkAndGrant('perfect-match');
  }
  if (context?.gameId === 'memory-match' && Number(context.extra?.winnerPairs || 0) >= 8) {
    checkAndGrant('memory-master');
  }

  const distinctDays = db
    .prepare("SELECT COUNT(DISTINCT substr(created_at, 1, 10)) as d, COUNT(*) as total FROM game_scores WHERE user_id = ?")
    .get(userId) as any;
  if (Number(distinctDays?.d || 0) >= 2 || Number(distinctDays?.total || 0) >= 5) {
    checkAndGrant('daily-player');
  }

  if (unlockedNow.length === 0) return [];

  const all = getAchievementsWithStatus();
  const newlyUnlocked = all.filter((a) => unlockedNow.includes(a.id));
  for (const ach of newlyUnlocked) {
    createNotification(userId, 'achievement', `Achievement Unlocked: ${ach.title}`, `${ach.description} (+${ach.points} pts)`);
  }
  return newlyUnlocked;
}

export function getChatHistory(limit = 100): ChatMessage[] {
  const rows = db
    .prepare(
      `SELECT cm.*, p.username as sender_username, p.avatar_url as sender_avatar
       FROM chat_messages cm
       JOIN profiles p ON p.id = cm.sender_id
       ORDER BY cm.created_at ASC
       LIMIT ?`
    )
    .all(limit) as any[];

  return rows.map((r) => ({
    id: r.id,
    senderId: r.sender_id,
    senderUsername: r.sender_username,
    senderAvatar: r.sender_avatar,
    content: r.content,
    messageType: r.message_type,
    readAt: r.read_at,
    createdAt: r.created_at,
  }));
}

export function getMemories(): MemoryItem[] {
  const rows = db
    .prepare(
      `SELECT m.*, p.username as author_username
       FROM memories m
       JOIN profiles p ON p.id = m.author_id
       ORDER BY m.special_date DESC, m.created_at DESC`
    )
    .all() as any[];

  return rows.map((r) => ({
    id: r.id,
    authorId: r.author_id,
    authorUsername: r.author_username,
    title: r.title,
    caption: r.caption,
    personalNote: r.personal_note,
    specialDate: r.special_date,
    imageUrl: r.image_url,
    isFavorite: Boolean(r.is_favorite),
    createdAt: r.created_at,
  }));
}

export function getCustomPrompts(gameId: 'truth-or-dare' | 'who-knows-who'): CustomPromptItem[] {
  const rows = db
    .prepare('SELECT * FROM custom_prompts WHERE game_id = ? ORDER BY created_at DESC')
    .all(gameId) as any[];
  return rows.map((r) => ({
    id: r.id,
    gameId: r.game_id,
    category: r.category,
    promptType: r.prompt_type,
    content: r.content,
    authorId: r.author_id,
    createdAt: r.created_at,
  }));
}
