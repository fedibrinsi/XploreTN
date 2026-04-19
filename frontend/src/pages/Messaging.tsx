import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import {
  getConversations,
  getMessages,
  markAllRead,
  deleteMessage,
  createDM,
} from "../types/messages";
import type { Conversation, Message } from "../types/messages";
import { useSocket } from "../types/useSocket";
import type { TypingUser } from "../types/useSocket";
import { searchUsers } from "../types/messages";
import type { UserResult } from "../types/messages";
import { toImageUrl } from "../utils/imageUrl";
import messageImg from "../assets/message2.jpg";

// ── Types ──────────────────────────────────────────────────────────────────
interface LocalUser {
  id: number;
  fullName: string;
  image?: string | null;
}

// ── Utilities ──────────────────────────────────────────────────────────────
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-TN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getInitials(name?: string | null): string {
  if (!name?.trim()) return "?";
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getConversationName(
  conv: Conversation,
  currentUserId: number,
): string {
  if (conv.type === "group") return conv.name || "Group";
  const other = conv.participants.find((p) => p.userId !== currentUserId);
  return other?.user.fullName || "Conversation";
}

type GroupedItem =
  | { type: "date"; label: string; id: string }
  | (Message & { type: "message" });

function groupMessagesByDate(messages: Message[]): GroupedItem[] {
  const groups: GroupedItem[] = [];
  let currentDate: string | null = null;
  messages.forEach((msg) => {
    const date = formatDate(msg.createdAt);
    if (date !== currentDate) {
      currentDate = date;
      groups.push({ type: "date", label: date, id: `date-${msg.id}` });
    }
    groups.push({ type: "message", ...msg });
  });
  return groups;
}

const AVATAR_COLORS = [
  "#C4813A",
  "#7B6FAE",
  "#5B9E8C",
  "#C05757",
  "#4A7FA5",
  "#A0845C",
  "#7A9E5B",
  "#8B6A8B",
];
function avatarColor(initials: string): string {
  const idx =
    ((initials.charCodeAt(0) || 0) + (initials.charCodeAt(1) || 0)) %
    AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// ── Avatar ─────────────────────────────────────────────────────────────────
const BASE_URL =
  typeof window !== "undefined"
    ? (import.meta as any).env?.VITE_API_URL || "http://localhost:5000"
    : "http://localhost:5000";

function Avatar({
  initials,
  photo,
  size = 40,
  online = false,
}: {
  initials: string;
  photo?: string | null;
  size?: number;
  online?: boolean;
}) {
  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {photo ? (
        <img
          src={`${BASE_URL}/uploads/${photo}`}
          alt={initials}
          className="rounded-full object-cover w-full h-full"
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center text-white font-semibold select-none w-full h-full"
          style={{
            background: avatarColor(initials),
            fontSize: size * 0.35,
            letterSpacing: "0.04em",
          }}
        >
          {initials}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
      )}
    </div>
  );
}

// ── New DM Modal ───────────────────────────────────────────────────────────
function NewDMModal({
  onClose,
  onStart,
}: {
  onClose: () => void;
  onStart: (userId: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const BASE =
    (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

  const handleSearch = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim() || val.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchUsers(val);
        setResults(res);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  return (
    <>
      <Header />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(20,15,5,0.6)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-sm mx-4 rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: "var(--color-background-primary, #fff)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-outline-variant/20">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-outline text-xl">
                close
              </span>
            </button>
            <h2 className="font-headline text-2xl italic text-primary mb-0.5">
              New Message
            </h2>
            <p className="text-[11px] text-outline uppercase tracking-widest">
              Search by name
            </p>
          </div>

          {/* Search input */}
          <div className="px-4 py-3 border-b border-outline-variant/10">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg group-focus-within:text-primary transition-colors">
                search
              </span>
              <input
                autoFocus
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by name..."
                className="w-full bg-surface-container-low rounded-xl pl-10 pr-4 py-3 text-sm border-none focus:ring-2 focus:ring-primary/20 focus:outline-none placeholder:text-outline-variant"
              />
              {loading && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-outline-variant border-t-primary animate-spin" />
              )}
            </div>
          </div>

          {/* Results */}
          <div className="overflow-y-auto max-h-72 custom-scrollbar">
            {results.length === 0 && query.length >= 2 && !loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <span className="material-symbols-outlined text-3xl text-outline-variant">
                  person_search
                </span>
                <p className="text-sm text-outline">
                  No users found for "{query}"
                </p>
              </div>
            ) : results.length === 0 && query.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <span className="material-symbols-outlined text-3xl text-outline-variant">
                  group
                </span>
                <p className="text-sm text-outline">
                  Type at least 2 characters
                </p>
              </div>
            ) : (
              <div className="p-2">
                {results.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => onStart(user.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-high transition-colors text-left group"
                  >
                    <div className="relative w-11 h-11 flex-shrink-0">
                      {user.image ? (
                        <img
                          src={toImageUrl(user.image)}
                          alt={user.fullName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{
                            background: avatarColor(getInitials(user.fullName)),
                          }}
                        >
                          {getInitials(user.fullName)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-on-surface truncate">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-outline">Tap to message</p>
                    </div>
                    <span className="material-symbols-outlined text-outline text-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      chevron_right
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Typing Dots ────────────────────────────────────────────────────────────
function TypingBubble({ typers }: { typers: TypingUser[] }) {
  if (!typers.length) return null;
  return (
    <div className="flex gap-3 items-end max-w-[80%]">
      <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0 self-end">
        <span className="text-xs text-outline font-bold">
          {getInitials(typers[0]?.userName)}
        </span>
      </div>
      <div className="bg-surface-container-lowest p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
        <span className="text-xs text-outline ml-1">
          {typers.map((t) => t.userName.split(" ")[0]).join(", ")}
        </span>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function MessagingPage() {
  // ── Read navigation state (from "Request a Stay") ──────────────────────
  const location = useLocation();
  const navState = location.state as {
    targetConvId?: string;
    targetUserId?: number;
    autoMessage?: string;
  } | null;

  const currentUser = ((): LocalUser | null => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed.fullName && parsed.name) parsed.fullName = parsed.name;
      if (!parsed.id || !parsed.fullName) return null;
      return parsed as LocalUser;
    } catch {
      return null;
    }
  })();

  const {
    connected,
    onlineUsers,
    joinConversation,
    sendMessage: socketSend,
    startTyping,
    stopTyping,
    markRead,
    onNewMessage,
    onTypingStart,
    onTypingStop,
  } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typers, setTypers] = useState<TypingUser[]>([]);
  const [inputText, setInputText] = useState("");
  const [search, setSearch] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewDM, setShowNewDM] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // Track whether the auto-message has already been sent (avoid double send)
  const autoMessageSentRef = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // ── Load conversations ─────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    setLoadingConvs(true);
    getConversations()
      .then(setConversations)
      .catch(() => setError("Could not load conversations"))
      .finally(() => setLoadingConvs(false));
  }, []);

  // ── Auto-select conversation + send auto-message from nav state ────────
  useEffect(() => {
    if (!navState?.targetConvId) return;
    if (loadingConvs) return; // Wait until conversations are loaded
    if (autoMessageSentRef.current) return;

    const targetConv = conversations.find(
      (c) => c.id === navState.targetConvId,
    );
    if (!targetConv) return;

    // Select the conversation
    handleSelectConv(targetConv).then(() => {
      // Send auto-message if provided
      if (navState.autoMessage && connected && !autoMessageSentRef.current) {
        autoMessageSentRef.current = true;
        socketSend(targetConv.id, navState.autoMessage);
      }
    });
  }, [conversations, loadingConvs, navState, connected]);

  // ── Auto-start DM from targetUserId (e.g., from matched local card) ────
  useEffect(() => {
    if (!navState?.targetUserId) return;
    if (loadingConvs) return;
    if (autoMessageSentRef.current) return;

    // Check if a conversation already exists with this user
    const existingConv = conversations.find((c) =>
      c.participants.some((p) => p.userId === navState.targetUserId),
    );

    if (existingConv) {
      handleSelectConv(existingConv);
      autoMessageSentRef.current = true;
    } else {
      // Create a new DM
      handleStartDM(navState.targetUserId).then(() => {
        autoMessageSentRef.current = true;
      });
    }
  }, [conversations, loadingConvs, navState?.targetUserId]);

  // ── Socket: new messages ───────────────────────────────────────────────
  useEffect(() => {
    const unsub = onNewMessage((msg) => {
      if (msg.conversationId === activeConv?.id) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        markRead(msg.conversationId, msg.id);
      }
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== msg.conversationId) return c;
          return {
            ...c,
            messages: [msg],
            updatedAt: msg.createdAt,
            unreadCount: c.id === activeConv?.id ? 0 : (c.unreadCount ?? 0) + 1,
          };
        }),
      );
    });
    return unsub;
  }, [onNewMessage, activeConv?.id, markRead]);

  // ── Socket: typing ─────────────────────────────────────────────────────
  useEffect(() => {
    const unsubStart = onTypingStart((t) => {
      if (t.conversationId !== activeConv?.id) return;
      if (t.userId === currentUser?.id) return;
      setTypers((prev) =>
        prev.find((x) => x.userId === t.userId) ? prev : [...prev, t],
      );
    });
    const unsubStop = onTypingStop(({ userId, conversationId }) => {
      if (conversationId !== activeConv?.id) return;
      setTypers((prev) => prev.filter((t) => t.userId !== userId));
    });
    return () => {
      unsubStart();
      unsubStop();
    };
  }, [onTypingStart, onTypingStop, activeConv?.id, currentUser?.id]);

  // ── Auto-scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typers]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleSelectConv = useCallback(
    async (conv: Conversation) => {
      setActiveConv(conv);
      setMessages([]);
      setTypers([]);
      setNextCursor(null);
      setHasMore(false);
      setLoadingMsgs(true);
      setMobileView("chat");
      joinConversation(conv.id);
      try {
        const {
          messages: msgs,
          nextCursor: cursor,
          hasMore: more,
        } = await getMessages(conv.id);
        setMessages(msgs);
        setNextCursor(cursor);
        setHasMore(more);
        if ((conv.unreadCount ?? 0) > 0) {
          await markAllRead(conv.id);
          setConversations((prev) =>
            prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)),
          );
        }
      } catch {
        setError("Could not load messages");
      } finally {
        setLoadingMsgs(false);
      }
    },
    [joinConversation],
  );

  const handleLoadMore = useCallback(async () => {
    if (!activeConv || !nextCursor || !hasMore) return;
    try {
      const {
        messages: older,
        nextCursor: cursor,
        hasMore: more,
      } = await getMessages(activeConv.id, nextCursor);
      setMessages((prev) => [...older, ...prev]);
      setNextCursor(cursor);
      setHasMore(more);
    } catch {
      setError("Could not load older messages");
    }
  }, [activeConv, nextCursor, hasMore]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || !activeConv) return;
    socketSend(activeConv.id, inputText.trim());
    if (isTypingRef.current) {
      stopTyping(activeConv.id);
      isTypingRef.current = false;
    }
    setInputText("");
  }, [inputText, activeConv, socketSend, stopTyping]);

  const handleTyping = useCallback(
    (val: string) => {
      setInputText(val);
      if (!activeConv) return;
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        startTyping(activeConv.id);
      }
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          isTypingRef.current = false;
          stopTyping(activeConv.id);
        }
      }, 2000);
    },
    [activeConv, startTyping, stopTyping],
  );

  const handleDelete = useCallback(
    async (messageId: string) => {
      if (!activeConv) return;
      try {
        await deleteMessage(activeConv.id, messageId);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } catch {
        setError("Could not delete message");
      }
    },
    [activeConv],
  );

  const handleStartDM = useCallback(
    async (targetUserId: number) => {
      try {
        const conv = await createDM(targetUserId);
        setConversations((prev) =>
          prev.find((c) => c.id === conv.id) ? prev : [conv, ...prev],
        );
        setShowNewDM(false);
        handleSelectConv(conv);
      } catch {
        setError("Could not start conversation");
      }
    },
    [handleSelectConv],
  );

  const isOnline = (conv: Conversation): boolean => {
    const other = conv.participants.find((p) => p.userId !== currentUser?.id);
    return onlineUsers.some((u) => u.id === other?.userId);
  };

  const filteredConvs = conversations.filter((c) =>
    getConversationName(c, currentUser?.id ?? 0)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const grouped = groupMessagesByDate(messages);
  const convTypers = typers.filter((t) => t.conversationId === activeConv?.id);

  const activeOtherUser = activeConv?.participants.find(
    (p) => p.userId !== currentUser?.id,
  );

  // ── Guard ──────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <>
        <Header />

        <main className="pt-20 min-h-screen w-full bg-surface-container-low">
          <div className="w-full min-h-[calc(100vh-80px)] flex flex-col">
            <div className="w-full h-[45vh] relative">
              <img
                src={messageImg}
                alt="Messaging Hero"
                className="absolute inset-0 w-full h-full object-cover opacity"
              />
            </div>

            <div className="flex-1 w-full bg-surface px-6 md:px-20 py-12 flex flex-col items-center justify-center gap-6">
              <div className="flex items-center gap-1.5 bg-amber-50 rounded-full px-4 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
                <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">
                  Locals · Travellers · Stories
                </span>
              </div>

              <div className="text-center max-w-2xl">
                <h1 className="font-headline text-4xl md:text-5xl italic text-primary leading-tight mb-4">
                  Discover Tunisia through its people
                </h1>
                <p className="text-lg text-on-surface-variant leading-relaxed">
                  Chat directly with locals who share their favourite stays,
                  hidden restaurants, and authentic experiences — or connect
                  with fellow travellers on the same journey.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {[
                  "Medinas & riads",
                  "Local cuisine",
                  "Day trips",
                  "Trusted hosts",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="text-sm px-4 py-2 rounded-full border border-outline-variant/30 text-on-surface-variant bg-surface-container-low"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <a
                href="/auth"
                className="px-10 py-4 bg-primary text-on-primary rounded-xl text-sm font-bold uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-95 transition-transform"
              >
                Sign in to start chatting
              </a>

              <p className="text-sm text-outline text-center">
                New here?{" "}
                <a href="/auth" className="text-primary font-bold underline">
                  Create a free account
                </a>
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />

      {/* Error toast */}
      {error && (
        <div
          onClick={() => setError(null)}
          className="fixed top-20 right-4 z-50 bg-error text-on-error px-4 py-3 rounded-xl text-sm shadow-xl cursor-pointer flex items-center gap-2 max-w-xs"
        >
          <span className="material-symbols-outlined text-base">error</span>
          {error}
          <span className="material-symbols-outlined text-base ml-auto">
            close
          </span>
        </div>
      )}

      {showNewDM && (
        <NewDMModal
          onClose={() => setShowNewDM(false)}
          onStart={handleStartDM}
        />
      )}

      <main className="pt-20 h-[calc(100vh-0px)] flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* ══════════════════════════════════════════════════════════════
            SIDEBAR
        ══════════════════════════════════════════════════════════════ */}
        <aside
          className={`
            ${mobileView === "chat" ? "hidden" : "flex"} md:flex
            w-full md:w-[380px] border-r border-outline-variant/20
            bg-surface-container-low flex-col z-10 flex-shrink-0
          `}
        >
          {/* Header */}
          <div className="p-6 pb-3">
            <div className="flex items-center justify-between mb-5">
              <h1 className="font-headline text-3xl text-primary italic">
                Messages
              </h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high">
                  <span
                    className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"}`}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {connected ? "Live" : "Off"}
                  </span>
                </div>
                <button
                  onClick={() => setShowNewDM(true)}
                  title="New conversation"
                  className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-lg">
                    edit
                  </span>
                </button>
              </div>
            </div>

            {/* Current user pill */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-container-high mb-4">
              <Avatar
                initials={getInitials(currentUser.fullName)}
                photo={currentUser.image}
                size={32}
                online
              />
              <span className="text-sm font-semibold text-on-surface flex-1 truncate">
                {currentUser.fullName}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                You
              </span>
            </div>

            {/* Search */}
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg group-focus-within:text-primary transition-colors">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-container-lowest border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none placeholder:text-outline-variant shadow-sm"
                placeholder="Search conversations..."
              />
            </div>
          </div>

          {/* Online users strip */}
          {onlineUsers.length > 0 && (
            <div className="px-6 pb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline mb-2">
                Online · {onlineUsers.length}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {onlineUsers.slice(0, 6).map((u) => (
                  <span
                    key={u.id}
                    className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium"
                  >
                    {u.name.split(" ")[0]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto px-3 pb-6 custom-scrollbar">
            {loadingConvs ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 rounded-full border-2 border-outline-variant border-t-primary animate-spin" />
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="text-center py-12 px-4">
                <span className="material-symbols-outlined text-4xl text-outline-variant block mb-3">
                  forum
                </span>
                <p className="text-sm text-outline">No conversations yet</p>
                <button
                  onClick={() => setShowNewDM(true)}
                  className="mt-4 text-xs font-bold text-primary uppercase tracking-wider underline-offset-2 underline"
                >
                  Start one
                </button>
              </div>
            ) : (
              <div className="space-y-1 pt-1">
                {filteredConvs.map((conv) => {
                  const isActive = activeConv?.id === conv.id;
                  const name = getConversationName(conv, currentUser.id);
                  const initials = getInitials(name);
                  const otherUser = conv.participants.find(
                    (p) => p.userId !== currentUser.id,
                  );
                  const lastMsg = conv.messages[0];
                  const online = isOnline(conv);

                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConv(conv)}
                      className={`
                        relative flex items-center gap-3 p-3.5 rounded-xl cursor-pointer
                        transition-all duration-150 group
                        ${
                          isActive
                            ? "bg-surface-container-lowest shadow-sm"
                            : "hover:bg-surface-container-high"
                        }
                      `}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                      )}
                      <Avatar
                        initials={initials}
                        photo={otherUser?.user.image}
                        size={48}
                        online={online}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span
                            className={`font-semibold text-sm truncate ${
                              isActive
                                ? "text-on-surface"
                                : "text-on-surface/90"
                            }`}
                          >
                            {name}
                          </span>
                          {lastMsg && (
                            <span
                              className={`text-[10px] ml-2 flex-shrink-0 uppercase tracking-wider font-bold ${
                                isActive ? "text-primary" : "text-outline"
                              }`}
                            >
                              {formatRelativeTime(lastMsg.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-outline truncate flex-1">
                            {lastMsg ? lastMsg.text : "No messages yet"}
                          </p>
                          {(conv.unreadCount ?? 0) > 0 && (
                            <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-on-primary text-[10px] font-bold px-1 flex-shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* ══════════════════════════════════════════════════════════════
            CHAT PANEL
        ══════════════════════════════════════════════════════════════ */}
        {activeConv ? (
          <section
            className={`
              ${mobileView === "list" ? "hidden" : "flex"} md:flex
              flex-1 flex-col relative bg-surface min-w-0
            `}
          >
            {/* Arabesque pattern overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.025]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C4813A' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />

            {/* Chat header */}
            <header className="relative z-20 h-20 flex items-center justify-between px-6 bg-surface-container-low/60 backdrop-blur-md border-b border-outline-variant/10">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMobileView("list")}
                  className="md:hidden p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-outline">
                    arrow_back
                  </span>
                </button>

                <Avatar
                  initials={getInitials(
                    getConversationName(activeConv, currentUser.id),
                  )}
                  photo={activeOtherUser?.user.image}
                  size={42}
                  online={isOnline(activeConv)}
                />
                <div>
                  <h2 className="font-headline text-lg leading-tight text-on-surface">
                    {getConversationName(activeConv, currentUser.id)}
                  </h2>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      isOnline(activeConv) ? "text-emerald-500" : "text-outline"
                    }`}
                  >
                    {activeConv.type === "group"
                      ? `${activeConv.participants.length} members`
                      : isOnline(activeConv)
                        ? "Online Now"
                        : "Offline"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2.5 hover:bg-surface-container-high rounded-full transition-colors">
                  <span className="material-symbols-outlined text-outline text-xl">
                    videocam
                  </span>
                </button>
                <button className="p-2.5 hover:bg-surface-container-high rounded-full transition-colors">
                  <span className="material-symbols-outlined text-outline text-xl">
                    call
                  </span>
                </button>
                <button className="p-2.5 hover:bg-surface-container-high rounded-full transition-colors">
                  <span className="material-symbols-outlined text-outline text-xl">
                    info
                  </span>
                </button>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-1 custom-scrollbar relative z-10">
              {hasMore && (
                <div className="flex justify-center mb-4">
                  <button
                    onClick={handleLoadMore}
                    className="text-xs font-bold text-primary border border-primary/30 rounded-full px-5 py-1.5 hover:bg-primary/5 transition-colors uppercase tracking-wider"
                  >
                    Load earlier messages
                  </button>
                </div>
              )}

              {loadingMsgs ? (
                <div className="flex justify-center py-16">
                  <div className="w-7 h-7 rounded-full border-2 border-outline-variant border-t-primary animate-spin" />
                </div>
              ) : (
                <>
                  {grouped.map((item, i) => {
                    if (item.type === "date") {
                      return (
                        <div key={item.id} className="flex justify-center my-5">
                          <span className="px-4 py-1 rounded-full bg-surface-container-high text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                            {item.label}
                          </span>
                        </div>
                      );
                    }

                    const msg = item as Message & { type: "message" };
                    const isMine = msg.senderId === currentUser.id;
                    const prev = grouped[i - 1];
                    const showAvatar =
                      !isMine &&
                      (!prev ||
                        prev.type === "date" ||
                        (prev as Message).senderId !== msg.senderId);

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isMine ? "flex-row-reverse" : "flex-row"} items-end`}
                        onMouseEnter={() => setHoveredMsg(msg.id)}
                        onMouseLeave={() => setHoveredMsg(null)}
                      >
                        {!isMine &&
                          (showAvatar ? (
                            <Avatar
                              initials={getInitials(msg.sender.fullName)}
                              photo={msg.sender.image}
                              size={32}
                            />
                          ) : (
                            <div className="w-8 flex-shrink-0" />
                          ))}

                        <div
                          className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[72%]`}
                        >
                          {showAvatar && !isMine && (
                            <span className="text-[11px] text-outline font-semibold mb-1 ml-1">
                              {msg.sender.fullName}
                            </span>
                          )}

                          <div
                            className={`flex items-center gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
                          >
                            {isMine && hoveredMsg === msg.id && (
                              <button
                                onClick={() => handleDelete(msg.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-surface-container-high transition-all"
                                style={{
                                  opacity: hoveredMsg === msg.id ? 0.7 : 0,
                                }}
                              >
                                <span className="material-symbols-outlined text-outline text-sm">
                                  delete
                                </span>
                              </button>
                            )}

                            {isMine ? (
                              <div className="bg-gradient-to-br from-primary to-primary-container p-4 rounded-2xl rounded-br-none shadow-md text-on-primary text-sm leading-relaxed">
                                {msg.text}
                              </div>
                            ) : (
                              <div className="bg-surface-container-lowest p-4 rounded-2xl rounded-bl-none shadow-[0_2px_8px_rgba(0,0,0,0.05)] text-on-surface text-sm leading-relaxed border border-outline-variant/10">
                                {msg.text}
                              </div>
                            )}
                          </div>

                          <div
                            className={`flex items-center gap-1 mt-1 px-1 ${isMine ? "flex-row-reverse" : "flex-row"}`}
                          >
                            <span className="text-[10px] text-outline">
                              {formatTime(msg.createdAt)}
                            </span>
                            {isMine && (
                              <span
                                className="material-symbols-outlined text-primary text-xs"
                                style={{ fontSize: 14 }}
                              >
                                {msg.readBy.length > 1 ? "done_all" : "done"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <TypingBubble typers={convTypers} />
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <footer className="relative z-20 p-4 bg-surface border-t border-outline-variant/10">
              <div className="flex items-center gap-3 bg-surface-container-low/90 backdrop-blur-xl border border-outline-variant/10 p-2 pl-5 rounded-full shadow-lg">
                <input
                  value={inputText}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && handleSend()
                  }
                  placeholder="Share your thoughts..."
                  className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm placeholder:text-outline-variant py-2 text-on-surface"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim() || !connected}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-on-primary shadow-md hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    send
                  </span>
                </button>
              </div>
              <p className="text-[10px] text-center mt-2 text-outline-variant font-medium uppercase tracking-[0.2em]">
                {connected ? "Encrypted · Socket.io" : "Reconnecting..."}
              </p>
            </footer>
          </section>
        ) : (
          /* Empty state */
          <section
            className={`
              ${mobileView === "list" ? "hidden" : "flex"} md:flex
              flex-1 items-center justify-center flex-col gap-5 bg-surface relative
            `}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.025]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C4813A' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-outline-variant">
                forum
              </span>
            </div>
            <div className="text-center">
              <h3 className="font-headline text-2xl italic text-primary mb-1">
                Your Conversations
              </h3>
              <p className="text-sm text-outline max-w-xs">
                Connect with locals and fellow explorers to personalize your
                journey.
              </p>
            </div>
            <button
              onClick={() => setShowNewDM(true)}
              className="px-8 py-3 bg-primary text-on-primary rounded-full text-sm font-bold shadow-md uppercase tracking-wider hover:scale-105 active:scale-95 transition-transform"
            >
              Start a Chat
            </button>
          </section>
        )}
      </main>
    </>
  );
}
