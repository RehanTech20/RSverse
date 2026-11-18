import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Award, X } from 'lucide-react';
import { apiRequest, getAuthToken, setAuthToken } from './lib/api';
import { soundEngine } from './lib/audio';
import type {
  AchievementItem,
  ChatMessage,
  GameCatalogItem,
  GameId,
  GameSessionPublic,
  MemoryItem,
  NotificationItem,
  PlayerStats,
  RecentActivityItem,
  Room,
  ThemeMode,
  UserProfile,
} from './types/rsverse';
import { LandingAuth } from './components/LandingAuth';
import { Navbar, type NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { NotFoundView } from './components/NotFoundView';
import { OfflineIndicator } from './components/PWAInstallButton';

const GamesLibraryView = React.lazy(() => import('./components/GamesLibraryView').then((m) => ({ default: m.GamesLibraryView })));
const RoomArenaView = React.lazy(() => import('./components/RoomArenaView').then((m) => ({ default: m.RoomArenaView })));
const ChatView = React.lazy(() => import('./components/ChatView').then((m) => ({ default: m.ChatView })));
const MemoriesView = React.lazy(() => import('./components/MemoriesView').then((m) => ({ default: m.MemoriesView })));
const LeaderboardView = React.lazy(() => import('./components/LeaderboardView').then((m) => ({ default: m.LeaderboardView })));
const SettingsView = React.lazy(() => import('./components/SettingsView').then((m) => ({ default: m.SettingsView })));

export default function App() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [authorizedUsers, setAuthorizedUsers] = useState<any[]>([]);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  const [games, setGames] = useState<GameCatalogItem[]>([]);
  const [myStats, setMyStats] = useState<PlayerStats | null>(null);
  const [partnerStats, setPartnerStats] = useState<PlayerStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [activeSession, setActiveSession] = useState<GameSessionPublic | null>(null);
  const [liveRemoteStroke, setLiveRemoteStroke] = useState<any>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [recentMatches, setRecentMatches] = useState<RecentActivityItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [wsConnected, setWsConnected] = useState(false);
  const [achievementToast, setAchievementToast] = useState<AchievementItem | null>(null);
  const [inviteToast, setInviteToast] = useState<Room | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isNotFoundRoute, setIsNotFoundRoute] = useState(() => {
    const p = window.location.pathname;
    return p !== '/' && p !== '/index.html';
  });

  const wsRef = useRef<WebSocket | null>(null);
  const activeTabRef = useRef<NavTab>(activeTab);
  activeTabRef.current = activeTab;
  const activeRoomRef = useRef<Room | null>(activeRoom);
  activeRoomRef.current = activeRoom;

  // Apply Tailwind v4 .dark class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Sync audio preferences
  useEffect(() => {
    if (user) {
      soundEngine.soundEnabled = user.soundEnabled;
      soundEngine.setAmbientMusic(user.musicEnabled);
    } else {
      soundEngine.setAmbientMusic(false);
    }
  }, [user?.soundEnabled, user?.musicEnabled]);

  const loadAllAppData = useCallback(async () => {
    const [meData, dashData, roomsData, chatData, memData, lbData, achData, notifData] = await Promise.all([
      apiRequest<{ user: UserProfile; partner: UserProfile | null; authorizedUsers: any[] }>('/api/auth/me'),
      apiRequest<any>('/api/dashboard'),
      apiRequest<{ rooms: Room[] }>('/api/rooms'),
      apiRequest<{ messages: ChatMessage[] }>('/api/chat'),
      apiRequest<{ memories: MemoryItem[] }>('/api/memories'),
      apiRequest<{ leaderboard: PlayerStats[]; recentMatches: RecentActivityItem[] }>('/api/leaderboard'),
      apiRequest<{ achievements: AchievementItem[] }>('/api/achievements'),
      apiRequest<{ notifications: NotificationItem[] }>('/api/notifications'),
    ]);

    setUser(meData.user);
    setPartner(meData.partner);
    setAuthorizedUsers(meData.authorizedUsers);
    setTheme(meData.user.themePreference);

    setGames(dashData.games || []);
    setMyStats(dashData.myStats);
    setPartnerStats(dashData.partnerStats);
    setRecentActivities(dashData.recentActivities || []);
    setAvailableRooms(roomsData.rooms || []);

    if (dashData.activeRoom) {
      setActiveRoom(dashData.activeRoom);
      const roomDetail = await apiRequest<{ room: Room; session: GameSessionPublic | null }>(
        `/api/rooms/${dashData.activeRoom.id}`
      );
      setActiveRoom(roomDetail.room);
      setActiveSession(roomDetail.session);
    }

    setMessages(chatData.messages || []);
    setMemories(memData.memories || []);
    setLeaderboard(lbData.leaderboard || []);
    setRecentMatches(lbData.recentMatches || []);
    setAchievements(achData.achievements || []);
    setNotifications(notifData.notifications || []);
  }, []);

  const refreshStatsAndLeaderboard = useCallback(async () => {
    try {
      const [dashData, lbData, achData] = await Promise.all([
        apiRequest<any>('/api/dashboard'),
        apiRequest<{ leaderboard: PlayerStats[]; recentMatches: RecentActivityItem[] }>('/api/leaderboard'),
        apiRequest<{ achievements: AchievementItem[] }>('/api/achievements'),
      ]);
      setMyStats(dashData.myStats);
      setPartnerStats(dashData.partnerStats);
      setRecentActivities(dashData.recentActivities || []);
      setLeaderboard(lbData.leaderboard || []);
      setRecentMatches(lbData.recentMatches || []);
      setAchievements(achData.achievements || []);
    } catch {
      // ignore
    }
  }, []);

  // Boot check
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setBooting(false);
      return;
    }
    loadAllAppData()
      .catch(() => {
        setAuthToken(null);
      })
      .finally(() => setBooting(false));
  }, [loadAllAppData]);

  // WebSocket lifecycle with auto-reconnect
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 800;

    const connect = () => {
      if (cancelled) return;
      const token = getAuthToken();
      if (!token) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        retryDelay = 800;
        if (activeRoomRef.current) {
          ws.send(JSON.stringify({ event: 'room:sync', data: { roomId: activeRoomRef.current.id } }));
        }
      };

      ws.onmessage = (ev) => {
        try {
          const { event, data } = JSON.parse(ev.data);
          if (event === 'presence:update') {
            setPartner((prev) =>
              prev && prev.id === data.userId
                ? { ...prev, isOnline: data.isOnline, lastSeen: data.lastSeen }
                : prev
            );
            setActiveRoom((prev) =>
              prev
                ? {
                    ...prev,
                    players: prev.players.map((p) =>
                      p.userId === data.userId ? { ...p, isOnline: data.isOnline } : p
                    ),
                  }
                : prev
            );
          } else if (event === 'profile:updated') {
            if (data.id === user.id) {
              setUser(data);
              setTheme(data.themePreference);
            } else {
              setPartner(data);
            }
          } else if (event === 'universe:updated') {
            apiRequest<{ user: UserProfile; partner: UserProfile | null; authorizedUsers: any[] }>('/api/auth/me')
              .then((res) => {
                setPartner(res.partner);
                setAuthorizedUsers(res.authorizedUsers);
              })
              .catch(() => {});
          } else if (event === 'room:updated') {
            setActiveRoom((prev) => {
              if (!prev || prev.id === data.id) return data;
              return prev;
            });
          } else if (event === 'rooms:list_changed') {
            apiRequest<{ rooms: Room[] }>('/api/rooms')
              .then((r) => setAvailableRooms(r.rooms || []))
              .catch(() => {});
          } else if (event === 'room:invited') {
            soundEngine.playNotify();
            setInviteToast(data);
            apiRequest<{ rooms: Room[] }>('/api/rooms')
              .then((r) => setAvailableRooms(r.rooms || []))
              .catch(() => {});
          } else if (event === 'session:updated') {
            setLiveRemoteStroke(null);
            setActiveSession((prev) => {
              if (data.status === 'completed' && prev?.status !== 'completed') {
                soundEngine.playWin();
                refreshStatsAndLeaderboard();
              } else {
                soundEngine.playMove();
              }
              return data;
            });
          } else if (event === 'draw:live_stroke') {
            setLiveRemoteStroke(data);
          } else if (event === 'chat:message') {
            setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
            if (data.senderId !== user.id) {
              soundEngine.playNotify();
              if (activeTabRef.current === 'chat') {
                apiRequest('/api/chat/read', { method: 'POST' }).catch(() => {});
              }
            }
          } else if (event === 'chat:typing') {
            if (data.userId !== user.id) {
              setPartnerTyping(Boolean(data.isTyping));
            }
          } else if (event === 'chat:read') {
            setMessages((prev) =>
              prev.map((m) => (m.senderId === user.id && !m.readAt ? { ...m, readAt: data.readAt } : m))
            );
          } else if (event === 'memories:updated') {
            setMemories(data.memories || []);
          } else if (event === 'achievement:unlocked') {
            soundEngine.playWin();
            setAchievementToast(data);
            setTimeout(() => setAchievementToast(null), 5000);
          } else if (event === 'notification:new') {
            setNotifications((prev) => [data, ...prev]);
          } else if (event === 'notifications:updated') {
            setNotifications(data);
          }
        } catch {
          // ignore malformed event
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (!cancelled) {
          reconnectTimer = setTimeout(() => {
            retryDelay = Math.min(8000, retryDelay * 1.5);
            connect();
          }, retryDelay);
        }
      };
    };

    connect();
    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [user?.id, refreshStatsAndLeaderboard]);

  const handleAuthenticated = async (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    setTheme(loggedInUser.themePreference);
    await loadAllAppData();
  };

  const handleLogout = async () => {
    await apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => {});
    wsRef.current?.close();
    setAuthToken(null);
    setUser(null);
    setPartner(null);
    setActiveRoom(null);
    setActiveSession(null);
    setActiveTab('dashboard');
  };

  const handleCreateRoom = async (gameId?: GameId, settings: Record<string, unknown> = {}) => {
    const res = await apiRequest<{ room: Room }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ selectedGameId: gameId || 'tic-tac-toe', settings }),
    });
    setActiveRoom(res.room);
    setActiveSession(null);
    setActiveTab('room');
  };

  const handleJoinRoom = async (inviteCode: string) => {
    const res = await apiRequest<{ room: Room; session: GameSessionPublic | null }>('/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    });
    setActiveRoom(res.room);
    setActiveSession(res.session);
    setInviteToast(null);
    setShowJoinModal(false);
    setJoinCodeInput('');
    setActiveTab('room');
  };

  const handleSelectGame = async (gameId: GameId, settings: Record<string, unknown> = {}) => {
    if (!activeRoom) return;
    const res = await apiRequest<{ room: Room }>(`/api/rooms/${activeRoom.id}/select-game`, {
      method: 'POST',
      body: JSON.stringify({ gameId, settings }),
    });
    setActiveRoom(res.room);
    setActiveSession(null);
  };

  const handleToggleReady = async () => {
    if (!activeRoom) return;
    const res = await apiRequest<{ room: Room }>(`/api/rooms/${activeRoom.id}/ready`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    setActiveRoom(res.room);
  };

  const handleStartGame = async () => {
    if (!activeRoom) return;
    const res = await apiRequest<{ room: Room; session: GameSessionPublic }>(`/api/rooms/${activeRoom.id}/start`, {
      method: 'POST',
    });
    setActiveRoom(res.room);
    setActiveSession(res.session);
  };

  const handleRematch = async () => {
    if (!activeRoom) return;
    const res = await apiRequest<{ room: Room; session: GameSessionPublic }>(`/api/rooms/${activeRoom.id}/rematch`, {
      method: 'POST',
    });
    setActiveRoom(res.room);
    setActiveSession(res.session);
  };

  const handleLeaveRoom = async () => {
    if (!activeRoom) return;
    await apiRequest(`/api/rooms/${activeRoom.id}/leave`, { method: 'POST' });
    setActiveRoom(null);
    setActiveSession(null);
    setActiveTab('dashboard');
  };

  const handleGameMove = async (moveType: string, payload: Record<string, unknown> = {}) => {
    if (!activeSession) return;
    const res = await apiRequest<{ session: GameSessionPublic }>(`/api/games/${activeSession.id}/move`, {
      method: 'POST',
      body: JSON.stringify({ moveType, payload }),
    });
    setActiveSession(res.session);
  };

  const handleEmitLiveStroke = (stroke: any) => {
    if (!activeRoom || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ event: 'draw:live_stroke', data: { roomId: activeRoom.id, stroke } }));
  };

  const handleSendChat = async (content: string, messageType: 'text' | 'emoji' = 'text') => {
    await apiRequest('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ content, messageType }),
    });
  };

  const handleTypingChange = (isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: 'chat:typing', data: { isTyping } }));
    }
  };

  const handleMarkChatRead = () => {
    apiRequest('/api/chat/read', { method: 'POST' }).catch(() => {});
  };

  if (isNotFoundRoute) {
    return (
      <NotFoundView
        onReturnHome={() => {
          window.history.replaceState({}, '', '/');
          setIsNotFoundRoute(false);
        }}
      />
    );
  }

  if (booting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0714] text-white gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
        <p className="font-display text-sm tracking-wide text-slate-300">Entering RSverse...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingAuth
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onAuthenticated={handleAuthenticated}
        />
        <OfflineIndicator />
      </>
    );
  }

  const unreadChatCount = messages.filter((m) => m.senderId !== user.id && !m.readAt).length;
  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#F8F7FC] text-[#141024] dark:bg-[#0A0714] dark:text-[#F4F1FF] transition-colors">
      <Navbar
        activeTab={activeTab}
        onNavigate={setActiveTab}
        user={user}
        activeRoom={activeRoom}
        unreadChatCount={unreadChatCount}
        unreadNotifCount={unreadNotifCount}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 overflow-x-hidden">
        <Suspense
          fallback={
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
              <span>Loading view...</span>
            </div>
          }
        >
          {activeTab === 'dashboard' && (
            <DashboardView
              user={user}
              partner={partner}
              myStats={myStats}
              partnerStats={partnerStats}
              recentActivities={recentActivities}
              games={games}
              activeRoom={activeRoom}
              wsConnected={wsConnected}
              onNavigate={setActiveTab}
              onQuickCreateRoom={(gId) => handleCreateRoom(gId)}
              onOpenJoinModal={() => setShowJoinModal(true)}
            />
          )}

          {activeTab === 'games' && (
            <GamesLibraryView
              games={games}
              onCreateRoomWithGame={(gId) => handleCreateRoom(gId)}
              onOpenJoinModal={() => setShowJoinModal(true)}
            />
          )}

          {activeTab === 'room' && (
            <RoomArenaView
              currentUserId={user.id}
              games={games}
              room={activeRoom}
              session={activeSession}
              availableRooms={availableRooms}
              liveRemoteStroke={liveRemoteStroke}
              onCreateRoom={handleCreateRoom}
              onJoinRoom={handleJoinRoom}
              onSelectGame={handleSelectGame}
              onToggleReady={handleToggleReady}
              onStartGame={handleStartGame}
              onRematch={handleRematch}
              onLeaveRoom={handleLeaveRoom}
              onGameMove={handleGameMove}
              onEmitLiveStroke={handleEmitLiveStroke}
            />
          )}

          {activeTab === 'chat' && (
            <ChatView
              currentUser={user}
              partner={partner}
              messages={messages}
              partnerTyping={partnerTyping}
              onSendMessage={handleSendChat}
              onTypingChange={handleTypingChange}
              onMarkRead={handleMarkChatRead}
            />
          )}

          {activeTab === 'memories' && (
            <MemoriesView
              memories={memories}
              onAddMemory={async (payload) => {
                const res = await apiRequest<{ memories: MemoryItem[] }>('/api/memories', {
                  method: 'POST',
                  body: JSON.stringify(payload),
                });
                setMemories(res.memories);
              }}
              onToggleFavorite={async (id) => {
                const res = await apiRequest<{ memories: MemoryItem[] }>(`/api/memories/${id}/favorite`, {
                  method: 'POST',
                });
                setMemories(res.memories);
              }}
              onDeleteMemory={async (id) => {
                const res = await apiRequest<{ memories: MemoryItem[] }>(`/api/memories/${id}`, {
                  method: 'DELETE',
                });
                setMemories(res.memories);
              }}
            />
          )}

          {activeTab === 'leaderboard' && (
            <LeaderboardView
              currentUserId={user.id}
              leaderboard={leaderboard}
              achievements={achievements}
              recentMatches={recentMatches}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              user={user}
              authorizedUsers={authorizedUsers}
              notifications={notifications}
              onUpdateProfile={async (patch) => {
                const res = await apiRequest<{ user: UserProfile }>('/api/profile', {
                  method: 'PATCH',
                  body: JSON.stringify(patch),
                });
                setUser(res.user);
                setTheme(res.user.themePreference);
              }}
              onUploadAvatar={async (payload) => {
                const res = await apiRequest<{ user: UserProfile }>('/api/profile/avatar', {
                  method: 'POST',
                  body: JSON.stringify(payload),
                });
                setUser(res.user);
              }}
              onAuthorizePartner={async (email) => {
                const res = await apiRequest<{ authorizedUsers: any[] }>('/api/universe/authorize-partner', {
                  method: 'POST',
                  body: JSON.stringify({ email }),
                });
                setAuthorizedUsers(res.authorizedUsers);
              }}
              onMarkNotificationsRead={async () => {
                await apiRequest('/api/notifications/read', { method: 'POST' });
                setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
              }}
              onLogout={handleLogout}
            />
          )}
        </Suspense>
      </main>

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Join Partner&apos;s Room
              </h3>
              <button
                type="button"
                onClick={() => { setShowJoinModal(false); setJoinError(null); }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {joinError && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs text-rose-500">
                {joinError}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setJoinError(null);
                try {
                  await handleJoinRoom(joinCodeInput.trim());
                } catch (err: any) {
                  setJoinError(err.message || 'Could not join room');
                }
              }}
              className="space-y-3"
            >
              <input
                type="text"
                required
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter invitation code"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm font-mono-tabular uppercase tracking-widest text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 text-white text-sm font-semibold cursor-pointer"
              >
                Join Room
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Room Invite Toast */}
      <AnimatePresence>
        {inviteToast && (!activeRoom || activeRoom.id !== inviteToast.id) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 md:bottom-6 right-4 z-50 max-w-sm rounded-2xl border border-violet-500/40 bg-white dark:bg-[#191331] p-4 shadow-2xl space-y-3"
          >
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              Partner invited you to Room {inviteToast.inviteCode}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleJoinRoom(inviteToast.inviteCode)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 text-white text-xs font-semibold cursor-pointer"
              >
                Join Now
              </button>
              <button
                type="button"
                onClick={() => setInviteToast(null)}
                className="px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Achievement Unlock Toast */}
      <AnimatePresence>
        {achievementToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-4 z-50 max-w-sm rounded-2xl border border-amber-400/50 bg-[#1A132F] text-white p-4 shadow-2xl flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-amber-300">Achievement Unlocked · +{achievementToast.points} pts</div>
              <div className="font-display font-bold text-sm truncate">{achievementToast.title}</div>
              <div className="text-xs text-slate-300 line-clamp-1">{achievementToast.description}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <OfflineIndicator />
    </div>
  );
}
