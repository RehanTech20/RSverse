export type ThemeMode = 'dark' | 'light';

export type GameId =
  | 'tic-tac-toe'
  | 'rock-paper-scissors'
  | 'connect-4'
  | 'memory-match'
  | 'truth-or-dare'
  | 'who-knows-who'
  | 'emoji-guess'
  | 'drawing-guess'
  | 'guess-the-word';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: 'creator' | 'partner';
  avatarUrl: string;
  bio: string;
  isOnline: boolean;
  lastSeen: string;
  themePreference: ThemeMode;
  soundEnabled: boolean;
  musicEnabled: boolean;
  notificationsEnabled: boolean;
  createdAt: string;
}

export interface UniverseStatus {
  registeredCount: number;
  maxUsers: number;
  isLocked: boolean;
  authorizedEmailsCount: number;
  supabaseConfigured: boolean;
  profiles: Array<Pick<UserProfile, 'id' | 'username' | 'avatarUrl' | 'isOnline' | 'lastSeen' | 'role'>>;
}

export interface GameCatalogItem {
  id: GameId;
  slug: string;
  name: string;
  category: 'Classic' | 'Strategy' | 'Party' | 'Creative' | 'Word';
  description: string;
  accentColor: string;
  estimatedMinutes: string;
}

export interface RoomPlayer {
  userId: string;
  username: string;
  avatarUrl: string;
  isOnline: boolean;
  isReady: boolean;
  isConnected: boolean;
  role: 'creator' | 'partner';
}

export interface Room {
  id: string;
  inviteCode: string;
  hostId: string;
  selectedGameId: GameId | null;
  status: 'waiting' | 'ready' | 'playing' | 'completed' | 'expired';
  settings: Record<string, unknown>;
  players: RoomPlayer[];
  activeSessionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type WordMode = 'classic' | 'race' | 'timed' | 'hint' | 'category' | 'custom';
export type WordCategory =
  | 'Animals'
  | 'Food'
  | 'Movies'
  | 'Anime'
  | 'Technology'
  | 'Sports'
  | 'General'
  | 'Romantic';

export type LetterTileState = 'correct' | 'present' | 'absent';

export interface WordGuessRow {
  guess: string;
  feedback: LetterTileState[];
  submittedAt: string;
}

export interface OpponentWordRow {
  feedback: LetterTileState[];
}

export interface GameSessionPublic {
  id: string;
  roomId: string;
  gameId: GameId;
  status: 'active' | 'completed' | 'abandoned';
  currentTurn: string | null;
  winnerId: string | null;
  isDraw: boolean;
  roundNumber: number;
  startedAt: string;
  endedAt: string | null;
  scores: Record<string, number>;
  state: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatar: string;
  content: string;
  messageType: 'text' | 'emoji' | 'system';
  readAt: string | null;
  createdAt: string;
}

export interface MemoryItem {
  id: string;
  authorId: string;
  authorUsername: string;
  title: string;
  caption: string;
  personalNote: string;
  specialDate: string;
  imageUrl: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlockedByUserIds: string[];
  unlockedAtMap: Record<string, string>;
}

export interface PlayerStats {
  userId: string;
  username: string;
  avatarUrl: string;
  isOnline: boolean;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winPercentage: number;
  currentStreak: number;
  highestStreak: number;
  favoriteGame: string | null;
  totalPoints: number;
}

export interface RecentActivityItem {
  id: string;
  gameId: GameId;
  gameName: string;
  winnerUsername: string | null;
  isDraw: boolean;
  endedAt: string;
  summary: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface CustomPromptItem {
  id: string;
  gameId: 'truth-or-dare' | 'who-knows-who';
  category: string;
  promptType: string;
  content: string;
  authorId: string;
  createdAt: string;
}
