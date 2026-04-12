import { Server, Socket } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import prisma from "./prisma";

// ── Types ──────────────────────────────────────────────────────────────────
interface SocketUser {
  userId: number;
  fullName: string;
  image?: string | null;
  socketId: string;
}

// Map userId → SocketUser (une seule entrée par user, dernière connexion gagne)
const onlineUsers = new Map<number, SocketUser>();

function broadcastOnlineUsers(io: Server) {
  const users = Array.from(onlineUsers.values()).map((u) => ({
    id: u.userId,
    name: u.fullName,
  }));
  io.emit("users:online", users);
}

// ── Init ───────────────────────────────────────────────────────────────────
export function initSocket(server: http.Server) {
  const io = new Server(server, {
    cors: {
      // Accepte toutes les origines localhost en dev
      origin: (origin, callback) => {
        if (!origin || origin.startsWith("http://localhost")) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    },
  });

  // ── Middleware auth JWT ────────────────────────────────────────────────
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error("No token provided"));
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: number;
        email?: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, fullName: true, image: true },
      });

      if (!user) return next(new Error("User not found"));

      // Attacher l'user au socket pour y accéder dans les handlers
      (socket as any).user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  // ── Connexion ──────────────────────────────────────────────────────────
  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user as {
      id: number;
      fullName: string;
      image?: string | null;
    };

    console.log(`[Socket] Connecté: ${socket.id} — ${user.fullName}`);

    // Enregistrer l'utilisateur en ligne
    onlineUsers.set(user.id, {
      userId: user.id,
      fullName: user.fullName,
      image: user.image,
      socketId: socket.id,
    });

    broadcastOnlineUsers(io);

    // ── conversation:join ────────────────────────────────────────────────
    // Le frontend émet : { conversationId }
    socket.on(
      "conversation:join",
      async ({ conversationId }: { conversationId: string }) => {
        if (!conversationId) return;

        // Vérifier que l'user est bien participant
        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: { conversationId, userId: user.id },
          },
        });

        if (!participant) {
          socket.emit("error", {
            message: "Accès refusé à cette conversation",
          });
          return;
        }

        socket.join(conversationId);
        console.log(
          `[Socket] ${user.fullName} a rejoint la conversation ${conversationId}`,
        );
      },
    );

    // ── message:send ─────────────────────────────────────────────────────
    // Le frontend émet : { conversationId, text }
    socket.on(
      "message:send",
      async ({
        conversationId,
        text,
      }: {
        conversationId: string;
        text: string;
      }) => {
        if (!conversationId || !text?.trim()) return;

        try {
          // Vérifier participation
          const participant = await prisma.conversationParticipant.findUnique({
            where: {
              conversationId_userId: { conversationId, userId: user.id },
            },
          });

          if (!participant) {
            socket.emit("error", { message: "Accès refusé" });
            return;
          }

          // Créer le message en base
          const message = await prisma.message.create({
            data: {
              conversationId,
              senderId: user.id,
              text: text.trim(),
              readBy: [String(user.id)],
            },
            include: {
              sender: {
                select: { id: true, fullName: true, image: true },
              },
            },
          });

          // Mettre à jour updatedAt de la conversation
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          });

          // Diffuser le message à tous les membres de la room
          io.to(conversationId).emit("message:new", message);

          console.log(
            `[Socket] Message de ${user.fullName} dans ${conversationId}`,
          );
        } catch (err) {
          console.error("[Socket] message:send error:", err);
          socket.emit("error", {
            message: "Erreur lors de l'envoi du message",
          });
        }
      },
    );

    // ── typing:start ─────────────────────────────────────────────────────
    // Le frontend émet : { conversationId }
    socket.on(
      "typing:start",
      ({ conversationId }: { conversationId: string }) => {
        if (!conversationId) return;
        socket.to(conversationId).emit("typing:start", {
          userId: user.id,
          userName: user.fullName,
          conversationId,
        });
      },
    );

    // ── typing:stop ──────────────────────────────────────────────────────
    // Le frontend émet : { conversationId }
    socket.on(
      "typing:stop",
      ({ conversationId }: { conversationId: string }) => {
        if (!conversationId) return;
        socket.to(conversationId).emit("typing:stop", {
          userId: user.id,
          conversationId,
        });
      },
    );

    // ── message:read ─────────────────────────────────────────────────────
    // Le frontend émet : { conversationId, messageId }
    socket.on(
      "message:read",
      async ({
        conversationId,
        messageId,
      }: {
        conversationId: string;
        messageId: string;
      }) => {
        if (!conversationId || !messageId) return;

        try {
          const message = await prisma.message.findUnique({
            where: { id: messageId },
            select: { id: true, readBy: true },
          });

          if (!message || message.readBy.includes(String(user.id))) return;

          await prisma.message.update({
            where: { id: messageId },
            data: { readBy: { push: String(user.id) } },
          });

          // Notifier les autres membres
          socket.to(conversationId).emit("message:read", {
            conversationId,
            messageId,
            readBy: user.id,
          });
        } catch (err) {
          console.error("[Socket] message:read error:", err);
        }
      },
    );

    // ── disconnect ────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`[Socket] Déconnecté: ${socket.id} — ${user.fullName}`);

      // Supprimer seulement si c'est bien le socket actuel de cet user
      const registered = onlineUsers.get(user.id);
      if (registered?.socketId === socket.id) {
        onlineUsers.delete(user.id);
        broadcastOnlineUsers(io);
      }
    });
  });

  return io;
}
