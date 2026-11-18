import React, { useEffect, useRef, useState } from 'react';
import { CheckCheck, MessageCircleHeart, Send, Smile } from 'lucide-react';
import type { ChatMessage, UserProfile } from '../types/rsverse';

interface ChatViewProps {
  currentUser: UserProfile;
  partner: UserProfile | null;
  messages: ChatMessage[];
  partnerTyping: boolean;
  onSendMessage: (content: string, messageType?: 'text' | 'emoji') => Promise<void>;
  onTypingChange: (isTyping: boolean) => void;
  onMarkRead: () => void;
}

const QUICK_EMOJIS = ['❤️', '😘', '🥰', '✨', '🎮', '🔥', '😂', '🫶', '🌙', '🎉'];

export const ChatView: React.FC<ChatViewProps> = ({
  currentUser,
  partner,
  messages,
  partnerTyping,
  onSendMessage,
  onTypingChange,
  onMarkRead,
}) => {
  const [text, setText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [sending, setSending] = useState(false);
  const [failedDraft, setFailedDraft] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onMarkRead();
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      onTypingChange(false);
    };
  }, []);

  const handleInputChange = (val: string) => {
    setText(val);
    onTypingChange(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      onTypingChange(false);
    }, 1500);
  };

  const sendMessageContent = async (msg: string) => {
    setSending(true);
    setSendError(null);
    setFailedDraft(null);
    try {
      await onSendMessage(msg, 'text');
    } catch (err: any) {
      setFailedDraft(msg);
      setSendError(err.message || 'Message failed to send.');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    const msg = text.trim();
    setText('');
    onTypingChange(false);
    await sendMessageContent(msg);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-11rem)] min-h-[480px] flex flex-col rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#130F24] overflow-hidden mb-16 md:mb-4">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {partner ? (
            <>
              <img
                src={partner.avatarUrl}
                alt={partner.username}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <div className="font-display font-bold text-slate-900 dark:text-white">
                  {partner.username}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${partner.isOnline ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                  <span>
                    {partnerTyping
                      ? 'Typing...'
                      : partner.isOnline
                      ? 'Online now'
                      : `Last seen ${new Date(partner.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Private Chat (Waiting for Partner to Join RSverse)
            </div>
          )}
        </div>
        <span className="text-xs text-slate-400">Encrypted 2-Player Channel</span>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-slate-500 dark:text-slate-400">
            <MessageCircleHeart className="w-9 h-9 text-rose-400" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Your private space is ready
            </p>
            <p className="text-xs max-w-xs">
              Send a message or reaction — only the two authorized players can access this conversation.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.senderId === currentUser.id;
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 ${
                    isMine
                      ? 'bg-gradient-to-r from-rose-500 to-violet-600 text-white'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                  <div
                    className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] font-mono-tabular ${
                      isMine ? 'text-white/75' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <span>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMine && (
                      <CheckCheck
                        className={`w-3.5 h-3.5 ${m.readAt ? 'text-cyan-200' : 'text-white/50'}`}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Emoji Bar */}
      {showEmojis && (
        <div className="px-5 py-2.5 border-t border-slate-200 dark:border-white/10 flex flex-wrap gap-2 bg-slate-50 dark:bg-white/[0.03]">
          {QUICK_EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => setText((prev) => prev + em)}
              className="text-xl hover:scale-115 transition p-1 cursor-pointer"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {sendError && failedDraft && (
        <div className="px-5 py-2.5 border-t border-rose-500/30 bg-rose-500/10 flex items-center justify-between gap-3 text-xs text-rose-600 dark:text-rose-200">
          <span className="truncate">{sendError}</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => sendMessageContent(failedDraft)}
              className="px-3 py-1 rounded-lg bg-rose-500 text-white font-semibold cursor-pointer"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => { setFailedDraft(null); setSendError(null); }}
              className="px-2 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-slate-200 dark:border-white/10 flex items-center gap-2.5"
      >
        <button
          type="button"
          onClick={() => setShowEmojis(!showEmojis)}
          aria-label="Toggle emoji picker"
          className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
        >
          <Smile className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-violet-600 text-white text-sm font-semibold disabled:opacity-45 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">{sending ? 'Sending...' : 'Send'}</span>
        </button>
      </form>
    </div>
  );
};
