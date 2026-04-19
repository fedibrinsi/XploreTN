import express from "express";
import { Request, Response } from "express";
import prisma from "../prisma";
import { authenticateJWT, AuthRequest } from "../middleware/auth";

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Crée une notification logement */
export async function createHousingNotification(params: {
  userId: number;
  housingId: string;
  reservationId: string;
  type:
    | "RESERVATION_REQUESTED"
    | "RESERVATION_ACCEPTED"
    | "RESERVATION_REJECTED"
    | "RESERVATION_CANCELLED"
    | "RESERVATION_COMPLETED";
}) {
  return prisma.notificationHousing.create({ data: params });
}

/** Crée une notification activité */
export async function createActivityNotification(params: {
  userId: number;
  activityId: number;
  reservationId: string;
  type:
    | "RESERVATION_REQUESTED"
    | "RESERVATION_ACCEPTED"
    | "RESERVATION_REJECTED"
    | "RESERVATION_CANCELLED"
    | "RESERVATION_COMPLETED";
}) {
  return prisma.notificationActivity.create({ data: params });
}

// ─── GET /api/notifications ───────────────────────────────────────────────────
// Retourne toutes les notifications (housing + activités) de l'utilisateur connecté
router.get("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user!.userId;

    const [housingNotifs, activityNotifs] = await Promise.all([
      prisma.notificationHousing.findMany({
        where: { userId },
        include: {
          housing: {
            select: {
              id: true,
              title: true,
              location: true,
              images: true,
              type: true,
            },
          },
          reservation: {
            select: {
              id: true,
              status: true,
              startDate: true,
              endDate: true,
              tourist: {
                select: { id: true, fullName: true, image: true },
              },
              housing: {
                select: {
                  owner: {
                    select: { id: true, fullName: true, image: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.notificationActivity.findMany({
        where: { userId },
        include: {
          activity: {
            select: {
              id: true,
              title: true,
              location: true,
              images: true,
              category: true,
              date: true,
            },
          },
          reservation: {
            select: {
              id: true,
              status: true,
              guests: true,
              notes: true,
              tourist: {
                select: { id: true, fullName: true, image: true },
              },
              activity: {
                select: {
                  creator: {
                    select: { id: true, fullName: true, image: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    function resolveActor(notif: any) {
      const TOURIST_ACTS = ["RESERVATION_REQUESTED", "RESERVATION_CANCELLED"];
      if (TOURIST_ACTS.includes(notif.type)) {
        return notif.reservation?.tourist ?? null;
      } else {
        if (notif.housingId) {
          return notif.reservation?.housing?.owner ?? null;
        } else {
          return notif.reservation?.activity?.creator ?? null;
        }
      }
    }
    // Fusionner et trier par date décroissante
    const merged = [
      ...housingNotifs.map((n) => ({
        ...n,
        kind: "housing" as const,
        actor: resolveActor(n),
      })),
      ...activityNotifs.map((n) => ({
        ...n,
        kind: "activity" as const,
        actor: resolveActor(n),
      })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return res.json(merged);
  } catch (error) {
    console.error("Get notifications error:", error);
    return res.status(500).json({ message: "Erreur interne du serveur." });
  }
});

// ─── GET /api/notifications/unread-count ─────────────────────────────────────
router.get(
  "/unread-count",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthRequest).user!.userId;

      const [housingCount, activityCount] = await Promise.all([
        prisma.notificationHousing.count({ where: { userId, isRead: false } }),
        prisma.notificationActivity.count({ where: { userId, isRead: false } }),
      ]);

      return res.json({ count: housingCount + activityCount });
    } catch (error) {
      console.error("Unread count error:", error);
      return res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },
);

// ─── PATCH /api/notifications/read-all ───────────────────────────────────────
// Marque toutes les notifications de l'utilisateur comme lues
router.patch(
  "/read-all",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthRequest).user!.userId;

      await Promise.all([
        prisma.notificationHousing.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true },
        }),
        prisma.notificationActivity.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true },
        }),
      ]);

      return res.json({
        message: "Toutes les notifications ont été marquées comme lues.",
      });
    } catch (error) {
      console.error("Read all notifications error:", error);
      return res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },
);

// ─── PATCH /api/notifications/housing/:id/read ───────────────────────────────
router.patch(
  "/housing/:id/read",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthRequest).user!.userId;
      const id = String(req.params.id);

      const notif = await prisma.notificationHousing.findUnique({
        where: { id },
      });
      if (!notif)
        return res.status(404).json({ message: "Notification introuvable." });
      if (notif.userId !== userId)
        return res.status(403).json({ message: "Accès refusé." });

      const updated = await prisma.notificationHousing.update({
        where: { id },
        data: { isRead: true },
      });
      return res.json(updated);
    } catch (error) {
      console.error("Read housing notification error:", error);
      return res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },
);

// ─── PATCH /api/notifications/activity/:id/read ──────────────────────────────
router.patch(
  "/activity/:id/read",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthRequest).user!.userId;
      const id = String(req.params.id);

      const notif = await prisma.notificationActivity.findUnique({
        where: { id },
      });
      if (!notif)
        return res.status(404).json({ message: "Notification introuvable." });
      if (notif.userId !== userId)
        return res.status(403).json({ message: "Accès refusé." });

      const updated = await prisma.notificationActivity.update({
        where: { id },
        data: { isRead: true },
      });
      return res.json(updated);
    } catch (error) {
      console.error("Read activity notification error:", error);
      return res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },
);

// ─── DELETE /api/notifications/housing/:id ───────────────────────────────────
router.delete(
  "/housing/:id",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthRequest).user!.userId;
      const id = String(req.params.id);

      const notif = await prisma.notificationHousing.findUnique({
        where: { id },
      });
      if (!notif)
        return res.status(404).json({ message: "Notification introuvable." });
      if (notif.userId !== userId)
        return res.status(403).json({ message: "Accès refusé." });

      await prisma.notificationHousing.delete({ where: { id } });
      return res.json({ message: "Notification supprimée." });
    } catch (error) {
      console.error("Delete housing notification error:", error);
      return res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },
);

// ─── DELETE /api/notifications/activity/:id ──────────────────────────────────
router.delete(
  "/activity/:id",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthRequest).user!.userId;
      const id = String(req.params.id);

      const notif = await prisma.notificationActivity.findUnique({
        where: { id },
      });
      if (!notif)
        return res.status(404).json({ message: "Notification introuvable." });
      if (notif.userId !== userId)
        return res.status(403).json({ message: "Accès refusé." });

      await prisma.notificationActivity.delete({ where: { id } });
      return res.json({ message: "Notification supprimée." });
    } catch (error) {
      console.error("Delete activity notification error:", error);
      return res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },
);

// ─── DELETE /api/notifications/clear-all ─────────────────────────────────────
router.delete(
  "/clear-all",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthRequest).user!.userId;

      await Promise.all([
        prisma.notificationHousing.deleteMany({ where: { userId } }),
        prisma.notificationActivity.deleteMany({ where: { userId } }),
      ]);

      return res.json({ message: "Toutes les notifications supprimées." });
    } catch (error) {
      console.error("Clear all notifications error:", error);
      return res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },
);

export default router;
