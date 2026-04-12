import { Router, Request, Response } from "express";
import { authenticateJWT } from "../middleware/auth";
import prisma from "../prisma";

const router = Router();

// Type utilitaire pour req avec user JWT
interface AuthRequest extends Request {
  user: {
    userId: number;
    email: string;
  };
}

// Helper pour extraire un param Express en string typé
function param(req: Request, key: string): string {
  const val = req.params[key];
  if (typeof val !== "string") throw new Error(`Missing param: ${key}`);
  return val;
}

// Toutes les routes nécessitent un JWT valide
router.use(authenticateJWT);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/messages/conversations
// Liste toutes les conversations de l'utilisateur avec dernier message + non lus
// ─────────────────────────────────────────────────────────────────────────────
router.get("/conversations", async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user.userId;

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, fullName: true, image: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: { id: true, fullName: true, image: true },
            },
          },
        },
      },
    });

    // Compter les messages non lus pour chaque conversation
    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            NOT: {
              readBy: {
                has: String(userId),
              },
            },
          },
        });

        // Trouver le participant courant pour lastReadAt
        const currentParticipant = conv.participants.find(
          (p) => p.userId === userId,
        );

        return {
          ...conv,
          unreadCount,
          lastReadAt: currentParticipant?.lastReadAt ?? null,
        };
      }),
    );

    res.json(withUnread);
  } catch (err) {
    console.error("[GET /conversations]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/messages/conversations/:id
// Détail d'une conversation (participants, infos)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/conversations/:id", async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user.userId;
  const conversationId = param(req, "id");

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, fullName: true, image: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation introuvable" });
    }

    // Vérifier que l'utilisateur est bien participant
    const isParticipant = conversation.participants.some(
      (p: { userId: number }) => p.userId === userId,
    );
    if (!isParticipant) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    res.json(conversation);
  } catch (err) {
    console.error("[GET /conversations/:id]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/messages/conversations
// Créer une conversation DM ou groupe
// Body DM    : { targetUserId: number }
// Body Groupe: { type: "group", name: string, participantIds: number[] }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/conversations", async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user.userId;
  const { targetUserId, type = "dm", name, participantIds = [] } = req.body;

  if (type === "dm" && !targetUserId) {
    return res.status(400).json({ error: "targetUserId requis pour un DM" });
  }

  if (type === "group" && !name?.trim()) {
    return res.status(400).json({ error: "name requis pour un groupe" });
  }

  if (type === "group" && participantIds.length === 0) {
    return res
      .status(400)
      .json({ error: "participantIds requis pour un groupe" });
  }

  try {
    // DM : chercher si une conversation existe déjà entre ces deux utilisateurs
    if (type === "dm") {
      const existing = await prisma.conversation.findFirst({
        where: {
          type: "dm",
          AND: [
            { participants: { some: { userId } } },
            { participants: { some: { userId: Number(targetUserId) } } },
          ],
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, fullName: true, image: true },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              sender: { select: { id: true, fullName: true, image: true } },
            },
          },
        },
      });

      if (existing) return res.json(existing);
    }

    // Construire la liste des participants
    const allParticipantIds: number[] =
      type === "dm"
        ? [userId, Number(targetUserId)]
        : [userId, ...participantIds.map(Number)];

    // Dédoublonner
    const uniqueIds = [...new Set(allParticipantIds)];

    // Vérifier que les utilisateurs cibles existent
    const usersExist = await prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });

    if (usersExist.length !== uniqueIds.length) {
      return res
        .status(404)
        .json({ error: "Un ou plusieurs utilisateurs introuvables" });
    }

    // Créer la conversation
    const conversation = await prisma.conversation.create({
      data: {
        type,
        name: type === "group" ? name.trim() : null,
        participants: {
          create: uniqueIds.map((id) => ({ userId: id })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, fullName: true, image: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    res.status(201).json(conversation);
  } catch (err) {
    console.error("[POST /conversations]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/messages/conversations/:id
// Modifier le nom d'un groupe
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/conversations/:id", async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user.userId;
  const conversationId = param(req, "id");
  const { name } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: "name requis" });
  }

  try {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!participant) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { name: name.trim() },
    });

    res.json(updated);
  } catch (err) {
    console.error("[PATCH /conversations/:id]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/messages/conversations/:id
// Quitter / supprimer une conversation
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/conversations/:id", async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user.userId;
  const conversationId = param(req, "id");

  try {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!participant) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    // Supprimer la participation de l'utilisateur
    await prisma.conversationParticipant.delete({
      where: { conversationId_userId: { conversationId, userId } },
    });

    // Si plus aucun participant, supprimer la conversation entière
    const remaining = await prisma.conversationParticipant.count({
      where: { conversationId },
    });

    if (remaining === 0) {
      await prisma.conversation.delete({ where: { id: conversationId } });
    }

    res.json({ message: "Conversation quittée" });
  } catch (err) {
    console.error("[DELETE /conversations/:id]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/messages/conversations/:id/messages
// Historique paginé par curseur (du plus récent au plus ancien)
// Query : cursor (id du dernier message connu), limit (défaut 50)
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  "/conversations/:id/messages",
  async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const conversationId = param(req, "id");
    const cursor =
      typeof req.query.cursor === "string" ? req.query.cursor : undefined;
    const limit = (req.query.limit as string) || "50";

    try {
      // Vérifier la participation
      const participant = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId } },
      });

      if (!participant) {
        return res.status(403).json({ error: "Accès refusé" });
      }

      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: Number(limit),
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        include: {
          sender: {
            select: { id: true, fullName: true, image: true },
          },
        },
      });

      // Retourner dans l'ordre chronologique (plus ancien → plus récent)
      const ordered = [...messages].reverse();

      res.json({
        messages: ordered,
        nextCursor:
          messages.length === Number(limit) && messages.length > 0
            ? ordered[0]?.id
            : null,
        hasMore: messages.length === Number(limit),
      });
    } catch (err) {
      console.error("[GET /conversations/:id/messages]", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/messages/conversations/:id/messages
// Envoyer un message via REST (alternative au Socket.io)
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/conversations/:id/messages",
  async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const conversationId = param(req, "id");
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ error: "text requis" });
    }

    try {
      const participant = await prisma.conversationParticipant.findUnique({
        where: { conversationId_userId: { conversationId, userId } },
      });

      if (!participant) {
        return res.status(403).json({ error: "Accès refusé" });
      }

      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          text: text.trim(),
          readBy: [String(userId)],
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

      res.status(201).json(message);
    } catch (err) {
      console.error("[POST /conversations/:id/messages]", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/messages/conversations/:id/messages/:messageId
// Supprimer un message (uniquement son propre message)
// ─────────────────────────────────────────────────────────────────────────────
router.delete(
  "/conversations/:id/messages/:messageId",
  async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.userId;
    const messageId = param(req, "messageId");

    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
      });

      if (!message) {
        return res.status(404).json({ error: "Message introuvable" });
      }

      if (message.senderId !== userId) {
        return res
          .status(403)
          .json({ error: "Vous ne pouvez supprimer que vos propres messages" });
      }

      await prisma.message.delete({ where: { id: messageId } });

      res.json({ message: "Message supprimé" });
    } catch (err) {
      console.error("[DELETE /messages/:messageId]", err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/messages/conversations/:id/unread
// Nombre de messages non lus dans une conversation
// ─────────────────────────────────────────────────────────────────────────────
router.get("/conversations/:id/unread", async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user.userId;
  const conversationId = param(req, "id");

  try {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!participant) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const count = await prisma.message.count({
      where: {
        conversationId,
        NOT: {
          readBy: {
            has: String(userId),
          },
        },
      },
    });

    res.json({ count });
  } catch (err) {
    console.error("[GET /conversations/:id/unread]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/messages/conversations/:id/read
// Marquer tous les messages d'une conversation comme lus
// ─────────────────────────────────────────────────────────────────────────────
router.patch("/conversations/:id/read", async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user.userId;
  const conversationId = param(req, "id");

  try {
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!participant) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    // Trouver tous les messages non lus par cet utilisateur
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        NOT: {
          readBy: {
            has: String(userId),
          },
        },
      },
      select: { id: true, readBy: true },
    });

    // Ajouter userId dans readBy pour chacun
    await Promise.all(
      unreadMessages.map((msg) =>
        prisma.message.update({
          where: { id: msg.id },
          data: {
            readBy: {
              push: String(userId),
            },
          },
        }),
      ),
    );

    // Mettre à jour lastReadAt du participant
    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });

    res.json({ read: unreadMessages.length });
  } catch (err) {
    console.error("[PATCH /conversations/:id/read]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/messages/unread/total
// Nombre total de messages non lus (toutes conversations confondues)
// Utile pour le badge de notification dans la navbar
// ─────────────────────────────────────────────────────────────────────────────
router.get("/unread/total", async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user.userId;

  try {
    // Récupérer toutes les conversations de l'utilisateur
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    const conversationIds = participations.map((p) => p.conversationId);

    const total = await prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        NOT: {
          readBy: {
            has: String(userId),
          },
        },
      },
    });

    res.json({ total });
  } catch (err) {
    console.error("[GET /unread/total]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/users/search?q=nom
router.get("/search", authenticateJWT, async (req: Request, res: Response) => {
  const userId = (req as AuthRequest).user.userId;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  if (!q || q.length < 2) {
    return res.json([]);
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        fullName: { contains: q, mode: "insensitive" },
      },
      select: { id: true, fullName: true, image: true },
      take: 10,
    });
    res.json(users);
  } catch (err) {
    console.error("[GET /users/search]", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
