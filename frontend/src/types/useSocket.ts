import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { Message } from "./messages";

const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface TypingUser {
  userId: number;
  userName: string;
  conversationId: string;
}

export interface OnlineUser {
  id: number;
  name: string;
}

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  onlineUsers: OnlineUser[];
  joinConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, text: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  markRead: (conversationId: string, messageId: string) => void;
  onNewMessage: (cb: (msg: Message) => void) => () => void;
  onTypingStart: (cb: (t: TypingUser) => void) => () => void;
  onTypingStop: (
    cb: (t: { userId: number; conversationId: string }) => void,
  ) => () => void;
  onMessageRead: (
    cb: (data: {
      conversationId: string;
      messageId: string;
      readBy: number;
    }) => void,
  ) => () => void;
}

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(SERVER_URL, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      console.log("[Socket] Connecté:", socket.id);
    });

    socket.on("disconnect", () => {
      setConnected(false);
      console.log("[Socket] Déconnecté");
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Erreur de connexion:", err.message);
      setConnected(false);
    });

    socket.on("users:online", (users: OnlineUser[]) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("conversation:join", { conversationId });
  }, []);

  const sendMessage = useCallback((conversationId: string, text: string) => {
    socketRef.current?.emit("message:send", { conversationId, text });
  }, []);

  const startTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit("typing:start", { conversationId });
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit("typing:stop", { conversationId });
  }, []);

  const markRead = useCallback((conversationId: string, messageId: string) => {
    socketRef.current?.emit("message:read", { conversationId, messageId });
  }, []);

  // ── Listeners (retournent un cleanup) ───────────────────────────────────

  const onNewMessage = useCallback((cb: (msg: Message) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on("message:new", cb);
    return () => socket.off("message:new", cb);
  }, []);

  const onTypingStart = useCallback((cb: (t: TypingUser) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on("typing:start", cb);
    return () => socket.off("typing:start", cb);
  }, []);

  const onTypingStop = useCallback(
    (cb: (t: { userId: number; conversationId: string }) => void) => {
      const socket = socketRef.current;
      if (!socket) return () => {};
      socket.on("typing:stop", cb);
      return () => socket.off("typing:stop", cb);
    },
    [],
  );

  const onMessageRead = useCallback(
    (
      cb: (data: {
        conversationId: string;
        messageId: string;
        readBy: number;
      }) => void,
    ) => {
      const socket = socketRef.current;
      if (!socket) return () => {};
      socket.on("message:read", cb);
      return () => socket.off("message:read", cb);
    },
    [],
  );

  return {
    socket: socketRef.current,
    connected,
    onlineUsers,
    joinConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markRead,
    onNewMessage,
    onTypingStart,
    onTypingStop,
    onMessageRead,
  };
}
