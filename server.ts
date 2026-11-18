import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import {
  computePlayerStats,
  createNotification,
  db,
  getAchievementsWithStatus,
  getAllGames,
  getChatHistory,
  getCustomPrompts,
  getLeaderboard,
  getMemories,
  getRecentActivities,
  getRoomById,
  initDatabase,
  mapProfileRow,
  UPLOADS_DIR,
} from './server/db';
import { createGameSession, getSanitizedSession, processGameMove } from './server/gameEngine';
import type { GameId } from './src/types/rsverse';

initDatabase();

const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.createHash('sha256').update(process.cwd() + '_rsverse_secret').digest('hex');

const DEFAULT_AVATARS = [
  '/src/assets/images/avatar_player_one_1795022088289.jpg',
  '/src/assets/images/avatar_player_two_1795022089302.jpg',
];

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, keyHex] = stored.split(':');
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

function signToken(payload: { userId: string; email: string }): string {
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token: string | undefined | null): { userId: string; email: string } | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!parsed.userId || parsed.exp < Date.now()) return null;
    return { userId: parsed.userId, email: parsed.email };
  } catch {
    return null;
  }
}

function saveBase64Image(dataUrl: string, prefix: string): string {
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i);
  if (!match) throw new Error('Invalid image format. Use PNG, JPEG, WEBP, or GIF.');
  const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
  const buf = Buffer.from(match[2], 'base64');
  if (buf.length > 5 * 1024 * 1024) throw new Error('Image exceeds 5MB limit.');
  const filename = `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buf);
  return `/uploads/${filename}`;
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const app = express();
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});
app.use(express.json({ limit: '8mb' }));

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      try {
        out[key] = decodeURIComponent(val);
      } catch {
        out[key] = val;
      }
    }
  }
  return out;
}

function setMediaCookie(res: express.Response, token: string) {
  res.cookie('rsverse_media', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === 'production',
  });
}

// In-memory rate limiter for authentication routes
const authRateMap = new Map<string, number[]>();
function rateLimitAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const maxAttempts = 30;
  const recent = (authRateMap.get(ip) || []).filter((ts) => now - ts < windowMs);
  if (recent.length >= maxAttempts) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Too many authentication attempts. Please wait a minute.' });
  }
  recent.push(now);
  authRateMap.set(ip, recent);
  next();
}

function requireMediaAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookies = parseCookies(req.headers.cookie);
  const queryToken = typeof req.query.token === 'string' ? req.query.token : null;
  const token = bearer || cookies['rsverse_media'] || queryToken;
  const verified = verifyToken(token);
  if (!verified) return res.status(401).json({ error: 'Authentication required to access private media' });
  const profile = db.prepare('SELECT id FROM profiles WHERE id = ?').get(verified.userId);
  if (!profile) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.use('/uploads', requireMediaAuth, express.static(UPLOADS_DIR));

// Auth middleware
interface AuthedRequest extends express.Request {
  user?: { id: string; email: string };
  token?: string;
}

function requireAuth(req: AuthedRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const verified = verifyToken(token);
  if (!verified) return res.status(401).json({ error: 'Authentication required' });
  const profile = db.prepare('SELECT id, email FROM profiles WHERE id = ?').get(verified.userId) as any;
  if (!profile) return res.status(401).json({ error: 'Account not found' });
  req.user = { id: profile.id, email: profile.email };
  req.token = token || undefined;
  next();
}

// WebSocket Connection Registry
const userSockets = new Map<string, Set<WebSocket>>();

function sendToUser(userId: string, event: string, data: unknown) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  const payload = JSON.stringify({ event, data });
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  }
}

function broadcastAll(event: string, data: unknown) {
  const payload = JSON.stringify({ event, data });
  for (const sockets of userSockets.values()) {
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    }
  }
}

function broadcastRoomUpdate(roomId: string) {
  const room = getRoomById(roomId);
  if (!room) return;
  for (const player of room.players) {
    sendToUser(player.userId, 'room:updated', room);
    if (room.activeSessionId) {
      const session = getSanitizedSession(room.activeSessionId, player.userId);
      if (session) sendToUser(player.userId, 'session:updated', session);
    }
  }
}

function broadcastAchievements(newlyUnlockedByUser: Record<string, any[]>) {
  for (const [uid, list] of Object.entries(newlyUnlockedByUser)) {
    if (list && list.length > 0) {
      for (const ach of list) {
        sendToUser(uid, 'achievement:unlocked', ach);
      }
      const notifs = db
        .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20')
        .all(uid) as any[];
      sendToUser(
        uid,
        'notifications:updated',
        notifs.map((n) => ({
          id: n.id,
          userId: n.user_id,
          type: n.type,
          title: n.title,
          body: n.body,
          isRead: Boolean(n.is_read),
          createdAt: n.created_at,
        }))
      );
    }
  }
}

// ---------------- AUTH & UNIVERSE ROUTES ----------------

app.get('/api/auth/status', (_req, res) => {
  const profiles = db.prepare('SELECT id, username, avatar_url, is_online, last_seen, role FROM profiles ORDER BY created_at ASC').all() as any[];
  const authCountRow = db.prepare('SELECT COUNT(*) as c FROM authorized_users').get() as any;
  const supabaseConfigured = Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY);
  res.json({
    registeredCount: profiles.length,
    maxUsers: 2,
    isLocked: profiles.length >= 2,
    authorizedEmailsCount: Number(authCountRow?.c || 0),
    supabaseConfigured,
    profiles: profiles.map((p) => ({
      id: p.id,
      username: p.username,
      avatarUrl: p.avatar_url,
      isOnline: Boolean(p.is_online),
      lastSeen: p.last_seen,
      role: p.role,
    })),
  });
});

app.post('/api/auth/signup', rateLimitAuth, (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email is required.' });
    if (username.length < 2 || username.length > 24) return res.status(400).json({ error: 'Username must be 2–24 characters.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const existingProfiles = db.prepare('SELECT id FROM profiles').all() as any[];
    if (existingProfiles.length >= 2) {
      return res.status(403).json({ error: 'This private universe is already locked to its two authorized players.' });
    }

    const emailTaken = db.prepare('SELECT id FROM profiles WHERE lower(email) = ?').get(email);
    if (emailTaken) return res.status(409).json({ error: 'An account with this email already exists.' });

    const userTaken = db.prepare('SELECT id FROM profiles WHERE lower(username) = ?').get(username.toLowerCase());
    if (userTaken) return res.status(409).json({ error: 'That username is already taken.' });

    // Check authorized_users list if partner email was pre-authorized
    const authorizedRows = db.prepare('SELECT * FROM authorized_users').all() as any[];
    const preAuth = authorizedRows.find((a) => a.email.toLowerCase() === email);
    if (authorizedRows.length >= 2 && !preAuth) {
      return res.status(403).json({ error: 'Your email is not on the 2-player authorization list for this universe.' });
    }

    const role: 'creator' | 'partner' = existingProfiles.length === 0 ? 'creator' : 'partner';
    const now = new Date().toISOString();
    const userId = crypto.randomUUID();
    const avatarUrl = existingProfiles.length === 0 ? DEFAULT_AVATARS[0] : DEFAULT_AVATARS[1];

    if (!preAuth) {
      db.prepare('INSERT INTO authorized_users (id, email, role, created_at) VALUES (?, ?, ?, ?)').run(
        crypto.randomUUID(),
        email,
        role,
        now
      );
    }

    db.prepare(
      `INSERT INTO profiles (id, email, username, password_hash, role, avatar_url, bio, is_online, last_seen, theme_preference, sound_enabled, music_enabled, notifications_enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, '', 1, ?, 'dark', 1, 0, 1, ?, ?)`
    ).run(userId, email, username, hashPassword(password), role, avatarUrl, now, now, now);

    const profile = mapProfileRow(db.prepare('SELECT * FROM profiles WHERE id = ?').get(userId));
    const token = signToken({ userId, email });
    setMediaCookie(res, token);
    broadcastAll('universe:updated', { registeredCount: existingProfiles.length + 1 });
    res.status(201).json({ token, user: profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Sign up failed' });
  }
});

app.post('/api/auth/login', rateLimitAuth, (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const row = db.prepare('SELECT * FROM profiles WHERE lower(email) = ?').get(email) as any;
  if (!row || !verifyPassword(password, row.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  const now = new Date().toISOString();
  db.prepare('UPDATE profiles SET is_online = 1, last_seen = ? WHERE id = ?').run(now, row.id);
  const token = signToken({ userId: row.id, email: row.email });
  setMediaCookie(res, token);
  const updated = mapProfileRow(db.prepare('SELECT * FROM profiles WHERE id = ?').get(row.id));
  res.json({ token, user: updated });
});

app.post('/api/auth/logout', requireAuth, (req: AuthedRequest, res) => {
  const now = new Date().toISOString();
  db.prepare('UPDATE profiles SET is_online = 0, last_seen = ? WHERE id = ?').run(now, req.user!.id);
  broadcastAll('presence:update', { userId: req.user!.id, isOnline: false, lastSeen: now });
  res.clearCookie('rsverse_media', { path: '/' });
  res.json({ ok: true });
});

app.post('/api/auth/forgot-password', rateLimitAuth, (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const row = db.prepare('SELECT id FROM profiles WHERE lower(email) = ?').get(email) as any;
  if (!row) {
    return res.status(404).json({ error: 'No account found with that email in this universe.' });
  }
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const now = new Date();
  const expires = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO password_resets (id, email, code, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)').run(
    crypto.randomUUID(),
    email,
    code,
    expires,
    now.toISOString()
  );
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    return res.json({
      ok: true,
      message: 'Recovery code created. Contact your universe host or use Supabase email recovery in production.',
    });
  }
  res.json({
    ok: true,
    message: 'Recovery code generated (valid for 15 minutes).',
    recoveryCode: code,
  });
});

app.post('/api/auth/reset-password', rateLimitAuth, (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.code || '').trim();
  const newPassword = String(req.body?.newPassword || '');
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  const reset = db
    .prepare('SELECT * FROM password_resets WHERE lower(email) = ? AND code = ? AND used = 0 ORDER BY created_at DESC LIMIT 1')
    .get(email, code) as any;
  if (!reset || new Date(reset.expires_at).getTime() < Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired recovery code.' });
  }
  db.prepare('UPDATE profiles SET password_hash = ?, updated_at = ? WHERE lower(email) = ?').run(
    hashPassword(newPassword),
    new Date().toISOString(),
    email
  );
  db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(reset.id);
  res.json({ ok: true });
});

app.post('/api/auth/change-password', requireAuth, rateLimitAuth, (req: AuthedRequest, res) => {
  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = String(req.body?.newPassword || '');
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }
  const row = db.prepare('SELECT id, password_hash FROM profiles WHERE id = ?').get(req.user!.id) as any;
  if (!row || !verifyPassword(currentPassword, row.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }
  db.prepare('UPDATE profiles SET password_hash = ?, updated_at = ? WHERE id = ?').run(
    hashPassword(newPassword),
    new Date().toISOString(),
    req.user!.id
  );
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
  if (req.token) setMediaCookie(res, req.token);
  const meRow = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user!.id);
  const partnerRow = db.prepare('SELECT * FROM profiles WHERE id != ? LIMIT 1').get(req.user!.id);
  const authUsers = db.prepare('SELECT id, email, role, created_at FROM authorized_users ORDER BY created_at ASC').all();
  res.json({
    user: mapProfileRow(meRow),
    partner: partnerRow ? mapProfileRow(partnerRow) : null,
    authorizedUsers: authUsers,
  });
});

// ---------------- PROFILE & SETTINGS ROUTES ----------------

app.patch('/api/profile', requireAuth, (req: AuthedRequest, res) => {
  const { username, bio, themePreference, soundEnabled, musicEnabled, notificationsEnabled } = req.body || {};
  const current = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user!.id) as any;
  if (!current) return res.status(404).json({ error: 'Profile not found' });

  const nextUsername = username !== undefined ? String(username).trim() : current.username;
  if (nextUsername.length < 2 || nextUsername.length > 24) {
    return res.status(400).json({ error: 'Username must be 2–24 characters.' });
  }
  if (nextUsername.toLowerCase() !== current.username.toLowerCase()) {
    const conflict = db.prepare('SELECT id FROM profiles WHERE lower(username) = ? AND id != ?').get(nextUsername.toLowerCase(), req.user!.id);
    if (conflict) return res.status(409).json({ error: 'Username already taken.' });
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE profiles
     SET username = ?, bio = ?, theme_preference = ?, sound_enabled = ?, music_enabled = ?, notifications_enabled = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    nextUsername,
    bio !== undefined ? String(bio).slice(0, 200) : current.bio,
    themePreference === 'light' || themePreference === 'dark' ? themePreference : current.theme_preference,
    soundEnabled !== undefined ? (soundEnabled ? 1 : 0) : current.sound_enabled,
    musicEnabled !== undefined ? (musicEnabled ? 1 : 0) : current.music_enabled,
    notificationsEnabled !== undefined ? (notificationsEnabled ? 1 : 0) : current.notifications_enabled,
    now,
    req.user!.id
  );

  const updated = mapProfileRow(db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user!.id));
  broadcastAll('profile:updated', updated);
  res.json({ user: updated });
});

app.post('/api/profile/avatar', requireAuth, (req: AuthedRequest, res) => {
  try {
    const { imageData, presetUrl } = req.body || {};
    let avatarUrl = '';
    if (presetUrl && DEFAULT_AVATARS.includes(presetUrl)) {
      avatarUrl = presetUrl;
    } else if (imageData) {
      avatarUrl = saveBase64Image(String(imageData), `avatar_${req.user!.id.slice(0, 8)}`);
    } else {
      return res.status(400).json({ error: 'Provide an image or avatar preset.' });
    }
    db.prepare('UPDATE profiles SET avatar_url = ?, updated_at = ? WHERE id = ?').run(
      avatarUrl,
      new Date().toISOString(),
      req.user!.id
    );
    const updated = mapProfileRow(db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user!.id));
    broadcastAll('profile:updated', updated);
    res.json({ user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/universe/authorize-partner', requireAuth, (req: AuthedRequest, res) => {
  const partnerEmail = String(req.body?.email || '').trim().toLowerCase();
  if (!partnerEmail || !partnerEmail.includes('@')) return res.status(400).json({ error: 'Valid partner email required.' });
  const existing = db.prepare('SELECT * FROM authorized_users').all() as any[];
  if (existing.some((a) => a.email.toLowerCase() === partnerEmail)) {
    return res.status(409).json({ error: 'That email is already authorized.' });
  }
  if (existing.length >= 2) {
    // Allow creator to replace an unregistered partner slot
    const partnerProfile = db.prepare("SELECT id FROM profiles WHERE role = 'partner'").get();
    if (partnerProfile) {
      return res.status(403).json({ error: 'Both universe player slots are already registered.' });
    }
    db.prepare("UPDATE authorized_users SET email = ? WHERE role = 'partner'").run(partnerEmail);
  } else {
    db.prepare('INSERT INTO authorized_users (id, email, role, created_at) VALUES (?, ?, ?, ?)').run(
      crypto.randomUUID(),
      partnerEmail,
      'partner',
      new Date().toISOString()
    );
  }
  const list = db.prepare('SELECT id, email, role, created_at FROM authorized_users ORDER BY created_at ASC').all();
  res.json({ authorizedUsers: list });
});

// ---------------- DASHBOARD, GAMES, LEADERBOARD, ACHIEVEMENTS ----------------

app.get('/api/dashboard', requireAuth, (req: AuthedRequest, res) => {
  const meRow = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.user!.id);
  const partnerRow = db.prepare('SELECT * FROM profiles WHERE id != ? LIMIT 1').get(req.user!.id) as any;
  const myStats = computePlayerStats(req.user!.id);
  const partnerStats = partnerRow ? computePlayerStats(partnerRow.id) : null;
  const recentActivities = getRecentActivities(8);
  const games = getAllGames();

  // Check active room user is part of
  const activeRoomRow = db
    .prepare(
      `SELECT r.id FROM rooms r
       JOIN room_players rp ON rp.room_id = r.id
       WHERE rp.user_id = ? AND r.status IN ('waiting', 'ready', 'playing')
       ORDER BY r.updated_at DESC LIMIT 1`
    )
    .get(req.user!.id) as any;

  const activeRoom = activeRoomRow ? getRoomById(activeRoomRow.id) : null;

  res.json({
    user: mapProfileRow(meRow),
    partner: partnerRow ? mapProfileRow(partnerRow) : null,
    myStats,
    partnerStats,
    recentActivities,
    games,
    activeRoom,
  });
});

app.get('/api/games', requireAuth, (_req, res) => {
  res.json({ games: getAllGames() });
});

app.get('/api/leaderboard', requireAuth, (_req, res) => {
  res.json({
    leaderboard: getLeaderboard(),
    recentMatches: getRecentActivities(15),
  });
});

app.get('/api/achievements', requireAuth, (_req, res) => {
  res.json({ achievements: getAchievementsWithStatus() });
});

app.get('/api/notifications', requireAuth, (req: AuthedRequest, res) => {
  const rows = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30')
    .all(req.user!.id) as any[];
  res.json({
    notifications: rows.map((n) => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      title: n.title,
      body: n.body,
      isRead: Boolean(n.is_read),
      createdAt: n.created_at,
    })),
  });
});

app.post('/api/notifications/read', requireAuth, (req: AuthedRequest, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user!.id);
  res.json({ ok: true });
});

// ---------------- CUSTOM PROMPTS (TRUTH OR DARE / WHO KNOWS WHO) ----------------

app.get('/api/prompts/:gameId', requireAuth, (req, res) => {
  const gameId = req.params.gameId;
  if (gameId !== 'truth-or-dare' && gameId !== 'who-knows-who') {
    return res.status(400).json({ error: 'Invalid gameId' });
  }
  res.json({ prompts: getCustomPrompts(gameId) });
});

app.post('/api/prompts', requireAuth, (req: AuthedRequest, res) => {
  const { gameId, category, promptType, content } = req.body || {};
  if (gameId !== 'truth-or-dare' && gameId !== 'who-knows-who') {
    return res.status(400).json({ error: 'Invalid gameId' });
  }
  const clean = String(content || '').trim();
  if (clean.length < 4 || clean.length > 240) {
    return res.status(400).json({ error: 'Prompt must be 4–240 characters.' });
  }
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO custom_prompts (id, game_id, category, prompt_type, content, author_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    gameId,
    String(category || 'Custom'),
    String(promptType || 'truth'),
    clean,
    req.user!.id,
    new Date().toISOString()
  );
  res.status(201).json({ prompts: getCustomPrompts(gameId) });
});

// ---------------- MULTIPLAYER ROOMS ----------------

app.get('/api/rooms', requireAuth, (_req, res) => {
  const rows = db
    .prepare("SELECT id FROM rooms WHERE status IN ('waiting', 'ready', 'playing') ORDER BY updated_at DESC LIMIT 10")
    .all() as any[];
  const rooms = rows.map((r) => getRoomById(r.id)).filter(Boolean);
  res.json({ rooms });
});

app.post('/api/rooms', requireAuth, (req: AuthedRequest, res) => {
  const selectedGameId = (req.body?.selectedGameId as GameId) || 'tic-tac-toe';
  const settings = req.body?.settings || {};
  const roomId = crypto.randomUUID();
  let inviteCode = generateInviteCode();
  while (db.prepare('SELECT id FROM rooms WHERE invite_code = ?').get(inviteCode)) {
    inviteCode = generateInviteCode();
  }
  const now = new Date().toISOString();

  // Clean up any stale solo waiting rooms hosted by this user before creating a new one
  db.prepare(
    `UPDATE rooms SET status = 'expired', updated_at = ?
     WHERE host_id = ? AND status = 'waiting'
     AND id IN (SELECT room_id FROM room_players GROUP BY room_id HAVING COUNT(*) <= 1)`
  ).run(now, req.user!.id);

  db.prepare(
    `INSERT INTO rooms (id, invite_code, host_id, selected_game_id, status, settings_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'waiting', ?, ?, ?)`
  ).run(roomId, inviteCode, req.user!.id, selectedGameId, JSON.stringify(settings), now, now);

  db.prepare(
    `INSERT INTO room_players (id, room_id, user_id, is_ready, is_connected, joined_at)
     VALUES (?, ?, ?, 0, 1, ?)`
  ).run(crypto.randomUUID(), roomId, req.user!.id, now);

  const room = getRoomById(roomId);
  // Notify partner if exists
  const partner = db.prepare('SELECT id FROM profiles WHERE id != ? LIMIT 1').get(req.user!.id) as any;
  const me = db.prepare('SELECT username FROM profiles WHERE id = ?').get(req.user!.id) as any;
  if (partner) {
    const notif = createNotification(
      partner.id,
      'room_invite',
      `Room Invite from ${me?.username || 'Partner'}`,
      `Join room ${inviteCode} to play together.`
    );
    sendToUser(partner.id, 'notification:new', notif);
    sendToUser(partner.id, 'room:invited', room);
  }
  broadcastAll('rooms:list_changed', {});
  res.status(201).json({ room });
});

app.post('/api/rooms/join', requireAuth, (req: AuthedRequest, res) => {
  const inviteCode = String(req.body?.inviteCode || '').trim().toUpperCase();
  if (!inviteCode) return res.status(400).json({ error: 'Invite code is required.' });

  const roomRow = db.prepare('SELECT * FROM rooms WHERE upper(invite_code) = ?').get(inviteCode) as any;
  if (!roomRow) return res.status(404).json({ error: 'No room found with that invitation code.' });
  if (roomRow.status === 'expired') return res.status(410).json({ error: 'This room has expired.' });

  const existingMember = db
    .prepare('SELECT id FROM room_players WHERE room_id = ? AND user_id = ?')
    .get(roomRow.id, req.user!.id);

  const now = new Date().toISOString();
  if (!existingMember) {
    const countRow = db.prepare('SELECT COUNT(*) as c FROM room_players WHERE room_id = ?').get(roomRow.id) as any;
    if (Number(countRow?.c || 0) >= 2) {
      return res.status(403).json({ error: 'Room already has 2 players.' });
    }
    db.prepare(
      `INSERT INTO room_players (id, room_id, user_id, is_ready, is_connected, joined_at)
       VALUES (?, ?, ?, 0, 1, ?)`
    ).run(crypto.randomUUID(), roomRow.id, req.user!.id, now);
  } else {
    db.prepare('UPDATE room_players SET is_connected = 1 WHERE room_id = ? AND user_id = ?').run(roomRow.id, req.user!.id);
  }

  db.prepare('UPDATE rooms SET updated_at = ? WHERE id = ?').run(now, roomRow.id);
  broadcastRoomUpdate(roomRow.id);
  broadcastAll('rooms:list_changed', {});
  const room = getRoomById(roomRow.id);
  const session = room?.activeSessionId ? getSanitizedSession(room.activeSessionId, req.user!.id) : null;
  res.json({ room, session });
});

app.get('/api/rooms/:roomId', requireAuth, (req: AuthedRequest, res) => {
  const room = getRoomById(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  const session = room.activeSessionId ? getSanitizedSession(room.activeSessionId, req.user!.id) : null;
  res.json({ room, session });
});

app.post('/api/rooms/:roomId/select-game', requireAuth, (req: AuthedRequest, res) => {
  const room = getRoomById(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (!room.players.some((p) => p.userId === req.user!.id)) return res.status(403).json({ error: 'Not in room' });

  const { gameId, settings } = req.body || {};
  const now = new Date().toISOString();
  if (room.activeSessionId) {
    db.prepare("UPDATE game_sessions SET status = 'abandoned', ended_at = ? WHERE id = ? AND status = 'active'").run(
      now,
      room.activeSessionId
    );
  }
  db.prepare(
    `UPDATE rooms SET selected_game_id = COALESCE(?, selected_game_id), settings_json = ?, status = 'waiting', active_session_id = NULL, updated_at = ? WHERE id = ?`
  ).run(gameId || null, JSON.stringify(settings ?? room.settings), now, room.id);
  // Reset ready flags when game changes
  if (gameId && gameId !== room.selectedGameId) {
    db.prepare('UPDATE room_players SET is_ready = 0 WHERE room_id = ?').run(room.id);
  }
  broadcastRoomUpdate(room.id);
  res.json({ room: getRoomById(room.id) });
});

app.post('/api/rooms/:roomId/ready', requireAuth, (req: AuthedRequest, res) => {
  const room = getRoomById(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  const player = room.players.find((p) => p.userId === req.user!.id);
  if (!player) return res.status(403).json({ error: 'Not in room' });

  const nextReady = req.body?.isReady !== undefined ? Boolean(req.body.isReady) : !player.isReady;
  db.prepare('UPDATE room_players SET is_ready = ? WHERE room_id = ? AND user_id = ?').run(
    nextReady ? 1 : 0,
    room.id,
    req.user!.id
  );

  const updatedRoom = getRoomById(room.id)!;
  const bothReady = updatedRoom.players.length === 2 && updatedRoom.players.every((p) => p.isReady);
  db.prepare('UPDATE rooms SET status = ?, updated_at = ? WHERE id = ?').run(
    bothReady ? 'ready' : 'waiting',
    new Date().toISOString(),
    room.id
  );

  broadcastRoomUpdate(room.id);
  res.json({ room: getRoomById(room.id) });
});

app.post('/api/rooms/:roomId/start', requireAuth, (req: AuthedRequest, res) => {
  const room = getRoomById(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (!room.players.some((p) => p.userId === req.user!.id)) return res.status(403).json({ error: 'Not in room' });
  if (room.players.length < 2) {
    return res.status(400).json({ error: 'Waiting for your partner to join the room.' });
  }
  if (!room.players.every((p) => p.isReady)) {
    return res.status(400).json({ error: 'Both players must click Ready before starting.' });
  }
  if (!room.selectedGameId) {
    return res.status(400).json({ error: 'Select a game first.' });
  }

  const playerIds = room.players.map((p) => p.userId);
  const sessionId = createGameSession(room.id, room.selectedGameId, playerIds, room.settings, 1);
  broadcastRoomUpdate(room.id);
  res.json({
    room: getRoomById(room.id),
    session: getSanitizedSession(sessionId, req.user!.id),
  });
});

app.post('/api/rooms/:roomId/rematch', requireAuth, (req: AuthedRequest, res) => {
  const room = getRoomById(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (!room.players.some((p) => p.userId === req.user!.id)) return res.status(403).json({ error: 'Not in room' });
  if (room.players.length < 2) return res.status(400).json({ error: 'Partner must be in the room for a rematch.' });
  if (!room.selectedGameId) return res.status(400).json({ error: 'No game selected.' });

  const prevRow = room.activeSessionId
    ? (db.prepare('SELECT round_number FROM game_sessions WHERE id = ?').get(room.activeSessionId) as any)
    : null;
  const nextRound = Number(prevRow?.round_number || 1) + 1;

  const sessionId = createGameSession(
    room.id,
    room.selectedGameId,
    room.players.map((p) => p.userId),
    room.settings,
    nextRound
  );
  broadcastRoomUpdate(room.id);
  res.json({
    room: getRoomById(room.id),
    session: getSanitizedSession(sessionId, req.user!.id),
  });
});

app.post('/api/rooms/:roomId/leave', requireAuth, (req: AuthedRequest, res) => {
  const room = getRoomById(req.params.roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  db.prepare('DELETE FROM room_players WHERE room_id = ? AND user_id = ?').run(room.id, req.user!.id);
  const remaining = db.prepare('SELECT * FROM room_players WHERE room_id = ?').all(room.id) as any[];
  const now = new Date().toISOString();
  if (remaining.length === 0) {
    db.prepare("UPDATE rooms SET status = 'expired', updated_at = ? WHERE id = ?").run(now, room.id);
  } else {
    db.prepare("UPDATE rooms SET status = 'waiting', updated_at = ? WHERE id = ?").run(now, room.id);
    if (room.activeSessionId) {
      db.prepare("UPDATE game_sessions SET status = 'abandoned', ended_at = ? WHERE id = ? AND status = 'active'").run(
        now,
        room.activeSessionId
      );
    }
    broadcastRoomUpdate(room.id);
  }
  broadcastAll('rooms:list_changed', {});
  res.json({ ok: true });
});

// ---------------- GAME MOVES ----------------

app.post('/api/games/:sessionId/move', requireAuth, (req: AuthedRequest, res) => {
  try {
    const { moveType, payload } = req.body || {};
    const result = processGameMove(req.params.sessionId, req.user!.id, String(moveType || ''), payload || {}, (roomId) => {
      broadcastRoomUpdate(roomId);
    });
    broadcastRoomUpdate(result.roomId);
    broadcastAchievements(result.newlyUnlockedByUser);
    if (result.delayedAction) {
      setTimeout(result.delayedAction.fn, result.delayedAction.delayMs);
    }
    res.json({ session: getSanitizedSession(result.sessionId, req.user!.id) });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid move' });
  }
});

// ---------------- PRIVATE CHAT ----------------

app.get('/api/chat', requireAuth, (_req, res) => {
  res.json({ messages: getChatHistory(150) });
});

app.post('/api/chat', requireAuth, (req: AuthedRequest, res) => {
  const content = String(req.body?.content || '').trim();
  const messageType = req.body?.messageType === 'emoji' ? 'emoji' : 'text';
  if (!content) return res.status(400).json({ error: 'Message cannot be empty.' });

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(
    `INSERT INTO chat_messages (id, sender_id, content, message_type, read_at, created_at)
     VALUES (?, ?, ?, ?, NULL, ?)`
  ).run(id, req.user!.id, content.slice(0, 2000), messageType, createdAt);

  const sender = db.prepare('SELECT username, avatar_url FROM profiles WHERE id = ?').get(req.user!.id) as any;
  const msg = {
    id,
    senderId: req.user!.id,
    senderUsername: sender?.username || 'Player',
    senderAvatar: sender?.avatar_url || DEFAULT_AVATARS[0],
    content: content.slice(0, 2000),
    messageType,
    readAt: null,
    createdAt,
  };
  broadcastAll('chat:message', msg);
  res.status(201).json({ message: msg });
});

app.post('/api/chat/read', requireAuth, (req: AuthedRequest, res) => {
  const now = new Date().toISOString();
  const changed = db
    .prepare('UPDATE chat_messages SET read_at = ? WHERE sender_id != ? AND read_at IS NULL')
    .run(now, req.user!.id);
  if (changed.changes > 0) {
    broadcastAll('chat:read', { readBy: req.user!.id, readAt: now });
  }
  res.json({ ok: true });
});

// ---------------- MEMORIES ----------------

app.get('/api/memories', requireAuth, (_req, res) => {
  res.json({ memories: getMemories() });
});

app.post('/api/memories', requireAuth, (req: AuthedRequest, res) => {
  try {
    const { title, caption, personalNote, specialDate, imageData } = req.body || {};
    const cleanTitle = String(title || '').trim();
    if (!cleanTitle) return res.status(400).json({ error: 'Memory title is required.' });
    if (!imageData) return res.status(400).json({ error: 'Please select a photo to upload.' });

    const imageUrl = saveBase64Image(String(imageData), 'memory');
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const dateVal = String(specialDate || createdAt.slice(0, 10));

    db.prepare(
      `INSERT INTO memories (id, author_id, title, caption, personal_note, special_date, image_url, is_favorite, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`
    ).run(id, req.user!.id, cleanTitle, String(caption || ''), String(personalNote || ''), dateVal, imageUrl, createdAt);

    const memories = getMemories();
    broadcastAll('memories:updated', { memories });
    res.status(201).json({ memories });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to save memory' });
  }
});

app.post('/api/memories/:id/favorite', requireAuth, (req, res) => {
  const row = db.prepare('SELECT is_favorite FROM memories WHERE id = ?').get(req.params.id) as any;
  if (!row) return res.status(404).json({ error: 'Memory not found' });
  const nextFav = row.is_favorite ? 0 : 1;
  db.prepare('UPDATE memories SET is_favorite = ? WHERE id = ?').run(nextFav, req.params.id);
  const memories = getMemories();
  broadcastAll('memories:updated', { memories });
  res.json({ memories });
});

app.delete('/api/memories/:id', requireAuth, (req, res) => {
  const row = db.prepare('SELECT image_url FROM memories WHERE id = ?').get(req.params.id) as any;
  if (!row) return res.status(404).json({ error: 'Memory not found' });
  db.prepare('DELETE FROM memories WHERE id = ?').run(req.params.id);
  if (row.image_url?.startsWith('/uploads/')) {
    const filePath = path.join(UPLOADS_DIR, path.basename(row.image_url));
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // ignore
      }
    }
  }
  const memories = getMemories();
  broadcastAll('memories:updated', { memories });
  res.json({ memories });
});

// ---------------- HTTP + WEBSOCKET + VITE SERVER ----------------

async function startServer() {
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch {
      socket.destroy();
    }
  });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '/ws', `http://${req.headers.host || 'localhost'}`);
    const token = url.searchParams.get('token');
    const verified = verifyToken(token);
    if (!verified) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    const userId = verified.userId;
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId)!.add(ws);

    const now = new Date().toISOString();
    db.prepare('UPDATE profiles SET is_online = 1, last_seen = ? WHERE id = ?').run(now, userId);
    db.prepare('UPDATE room_players SET is_connected = 1 WHERE user_id = ?').run(userId);
    broadcastAll('presence:update', { userId, isOnline: true, lastSeen: now });

    // Sync any active room immediately on connect/reconnect
    const activeRooms = db
      .prepare(
        `SELECT r.id FROM rooms r
         JOIN room_players rp ON rp.room_id = r.id
         WHERE rp.user_id = ? AND r.status IN ('waiting', 'ready', 'playing')`
      )
      .all(userId) as any[];
    for (const r of activeRooms) {
      broadcastRoomUpdate(r.id);
    }

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.event === 'chat:typing') {
          const partner = db.prepare('SELECT id FROM profiles WHERE id != ? LIMIT 1').get(userId) as any;
          if (partner) {
            sendToUser(partner.id, 'chat:typing', { userId, isTyping: Boolean(msg.data?.isTyping) });
          }
        } else if (msg.event === 'room:sync' && msg.data?.roomId) {
          const room = getRoomById(msg.data.roomId);
          if (room) {
            sendToUser(userId, 'room:updated', room);
            if (room.activeSessionId) {
              const session = getSanitizedSession(room.activeSessionId, userId);
              if (session) sendToUser(userId, 'session:updated', session);
            }
          }
        } else if (msg.event === 'game:move' && msg.data?.sessionId) {
          const result = processGameMove(
            msg.data.sessionId,
            userId,
            String(msg.data.moveType || ''),
            msg.data.payload || {},
            (roomId) => broadcastRoomUpdate(roomId)
          );
          broadcastRoomUpdate(result.roomId);
          broadcastAchievements(result.newlyUnlockedByUser);
          if (result.delayedAction) {
            setTimeout(result.delayedAction.fn, result.delayedAction.delayMs);
          }
        } else if (msg.event === 'draw:live_stroke' && msg.data?.roomId) {
          // Relay ephemeral live stroke preview to partner before stroke end commits
          const room = getRoomById(msg.data.roomId);
          if (room) {
            for (const p of room.players) {
              if (p.userId !== userId) {
                sendToUser(p.userId, 'draw:live_stroke', msg.data.stroke);
              }
            }
          }
        }
      } catch (err: any) {
        ws.send(JSON.stringify({ event: 'error', data: { message: err.message || 'Action failed' } }));
      }
    });

    ws.on('close', () => {
      const set = userSockets.get(userId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) {
          userSockets.delete(userId);
          const closedAt = new Date().toISOString();
          db.prepare('UPDATE profiles SET is_online = 0, last_seen = ? WHERE id = ?').run(closedAt, userId);
          db.prepare('UPDATE room_players SET is_connected = 0 WHERE user_id = ?').run(userId);
          broadcastAll('presence:update', { userId, isOnline: false, lastSeen: closedAt });
        }
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  // Periodic stale room expiration cleanup (rooms untouched > 24h)
  const cleanupTimer = setInterval(() => {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      db.prepare("UPDATE rooms SET status = 'expired', updated_at = ? WHERE status IN ('waiting', 'ready') AND updated_at < ?").run(
        new Date().toISOString(),
        cutoff
      );
    } catch {
      // ignore cleanup errors
    }
  }, 15 * 60 * 1000);
  cleanupTimer.unref();

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`RSverse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
