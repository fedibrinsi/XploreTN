import axios from "axios";

// ── Instance axios ─────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
});

// JWT injecté automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirection si token expiré
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

// ── Types alignés avec le schéma Prisma réel ──────────────────────────────

// Champs réels du modèle User : id, fullName, image
export interface User {
  id: number;
  fullName: string;
  image?: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: number;
  sender: User;
  text: string;
  createdAt: string;
  readBy: string[];
}

export interface Conversation {
  id: string;
  type: "dm" | "group";
  name: string | null;
  updatedAt: string;
  createdAt: string;
  participants: {
    userId: number;
    joinedAt: string;
    lastReadAt: string | null;
    user: User;
  }[];
  messages: Message[];
  unreadCount?: number;
  lastReadAt?: string | null;
}

export interface PaginatedMessages {
  messages: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface UserResult {
  id: number;
  fullName: string;
  image?: string | null;
}

export async function searchUsers(q: string): Promise<UserResult[]> {
  const { data } = await api.get("/api/messages/search", { params: { q } });
  return data;
}

// ── Conversations ──────────────────────────────────────────────────────────

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await api.get("/api/messages/conversations");
  return data;
}

export async function getConversation(id: string): Promise<Conversation> {
  const { data } = await api.get(`/api/messages/conversations/${id}`);
  return data;
}

export async function createDM(targetUserId: number): Promise<Conversation> {
  const { data } = await api.post("/api/messages/conversations", {
    targetUserId,
    type: "dm",
  });
  return data;
}

export async function createGroup(
  name: string,
  participantIds: number[],
): Promise<Conversation> {
  const { data } = await api.post("/api/messages/conversations", {
    type: "group",
    name,
    participantIds,
  });
  return data;
}

export async function renameConversation(
  id: string,
  name: string,
): Promise<Conversation> {
  const { data } = await api.patch(`/api/messages/conversations/${id}`, {
    name,
  });
  return data;
}

export async function leaveConversation(id: string): Promise<void> {
  await api.delete(`/api/messages/conversations/${id}`);
}

// ── Messages ───────────────────────────────────────────────────────────────

export async function getMessages(
  conversationId: string,
  cursor?: string,
  limit = 50,
): Promise<PaginatedMessages> {
  const params: Record<string, string | number> = { limit };
  if (cursor) params.cursor = cursor;
  const { data } = await api.get(
    `/api/messages/conversations/${conversationId}/messages`,
    { params },
  );
  return data;
}

export async function sendMessageREST(
  conversationId: string,
  text: string,
): Promise<Message> {
  const { data } = await api.post(
    `/api/messages/conversations/${conversationId}/messages`,
    { text },
  );
  return data;
}

export async function deleteMessage(
  conversationId: string,
  messageId: string,
): Promise<void> {
  await api.delete(
    `/api/messages/conversations/${conversationId}/messages/${messageId}`,
  );
}

// ── Non lus ────────────────────────────────────────────────────────────────

export async function getUnreadCount(conversationId: string): Promise<number> {
  const { data } = await api.get(
    `/api/messages/conversations/${conversationId}/unread`,
  );
  return data.count;
}

export async function markAllRead(conversationId: string): Promise<number> {
  const { data } = await api.patch(
    `/api/messages/conversations/${conversationId}/read`,
  );
  return data.read;
}

export async function getTotalUnread(): Promise<number> {
  const { data } = await api.get("/api/messages/unread/total");
  return data.total;
}

export default api;
