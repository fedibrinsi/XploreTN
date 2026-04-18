import express from "express";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma";

const router = express.Router();

// ─── Auth middleware ───────────────────────────────────────────────────────────
interface JwtPayload {
  id: number;
  email: string;
}

function authMiddleware(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token manquant ou invalide" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret",
    ) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Token expiré ou invalide" });
  }
}

// ─── POST /api/reservations ────────────────────────────────────────────────────
// Creates a PENDING reservation for a housing
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const touristId = (req as any).user.id;
    const { housingId, startDate, endDate } = req.body;

    if (!housingId) {
      return res.status(400).json({ message: "housingId est requis." });
    }

    // Check housing exists
    const housing = await prisma.housing.findUnique({
      where: { id: housingId },
    });
    if (!housing) {
      return res.status(404).json({ message: "Logement introuvable." });
    }

    // Prevent owner from reserving their own housing
    if (housing.ownerId === touristId) {
      return res.status(403).json({
        message: "Vous ne pouvez pas réserver votre propre logement.",
      });
    }

    // Check if tourist already has a PENDING or ACCEPTED reservation for this housing
    const existing = await prisma.reservation.findFirst({
      where: {
        housingId,
        touristId,
        status: { in: ["PENDING", "ACCEPTED"] },
      },
    });

    if (existing) {
      return res.status(409).json({
        message:
          existing.status === "ACCEPTED"
            ? "Vous avez déjà une réservation acceptée pour ce logement."
            : "Vous avez déjà une demande en attente pour ce logement.",
        reservation: existing,
      });
    }

    // Use provided dates or default: today → today + maxStayDays
    const start = startDate
      ? new Date(startDate)
      : new Date();
    const end = endDate
      ? new Date(endDate)
      : new Date(Date.now() + housing.maxStayDays * 24 * 60 * 60 * 1000);

    const reservation = await prisma.reservation.create({
      data: {
        housingId,
        touristId,
        status: "PENDING",
        startDate: start,
        endDate: end,
      },
      include: {
        housing: {
          select: { title: true, location: true, type: true },
        },
      },
    });

    return res.status(201).json({
      message: "Demande de réservation envoyée avec succès.",
      reservation,
    });
  } catch (error) {
    console.error("Create reservation error:", error);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

// ─── GET /api/reservations/my ──────────────────────────────────────────────────
// Returns all reservations for the current tourist
router.get("/my", authMiddleware, async (req: Request, res: Response) => {
  try {
    const touristId = (req as any).user.id;

    const reservations = await prisma.reservation.findMany({
      where: { touristId },
      include: {
        housing: {
          select: {
            id: true,
            title: true,
            location: true,
            type: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(reservations);
  } catch (error) {
    console.error("Get reservations error:", error);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

// ─── GET /api/reservations/housing/:housingId ──────────────────────────────────
// Returns all reservations for a given housing (owner only)
router.get(
  "/housing/:housingId",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const ownerId = (req as any).user.id;
      const housingId = req.params.housingId;

      const housing = await prisma.housing.findUnique({
        where: { id: housingId },
      });
      if (!housing) {
        return res.status(404).json({ message: "Logement introuvable." });
      }
      if (housing.ownerId !== ownerId) {
        return res.status(403).json({ message: "Accès refusé." });
      }

      const reservations = await prisma.reservation.findMany({
        where: { housingId },
        include: {
          tourist: {
            select: { id: true, fullName: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json(reservations);
    } catch (error) {
      console.error("Get housing reservations error:", error);
      return res.status(500).json({ message: "Erreur interne du serveur" });
    }
  },
);

// ─── PATCH /api/reservations/:id/status ───────────────────────────────────────
// Owner accepts or rejects a reservation
router.patch(
  "/:id/status",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const ownerId = (req as any).user.id;
      const reservationId = req.params.id;
      const { status } = req.body;

      if (!["ACCEPTED", "REJECTED"].includes(status)) {
        return res
          .status(400)
          .json({ message: "Statut invalide. Utilisez ACCEPTED ou REJECTED." });
      }

      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: { housing: true },
      });

      if (!reservation) {
        return res.status(404).json({ message: "Réservation introuvable." });
      }
      if (reservation.housing.ownerId !== ownerId) {
        return res.status(403).json({ message: "Accès refusé." });
      }
      if (reservation.status !== "PENDING") {
        return res.status(400).json({
          message: "Seules les réservations en attente peuvent être modifiées.",
        });
      }

      const updated = await prisma.reservation.update({
        where: { id: reservationId },
        data: { status },
      });

      return res.json({
        message:
          status === "ACCEPTED"
            ? "Réservation acceptée."
            : "Réservation refusée.",
        reservation: updated,
      });
    } catch (error) {
      console.error("Update reservation status error:", error);
      return res.status(500).json({ message: "Erreur interne du serveur" });
    }
  },
);

// ─── PATCH /api/reservations/:id/cancel ───────────────────────────────────────
// Tourist cancels their reservation
router.patch(
  "/:id/cancel",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const touristId = (req as any).user.id;
      const reservationId = req.params.id;

      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) {
        return res.status(404).json({ message: "Réservation introuvable." });
      }
      if (reservation.touristId !== touristId) {
        return res.status(403).json({ message: "Accès refusé." });
      }
      if (!["PENDING", "ACCEPTED"].includes(reservation.status)) {
        return res.status(400).json({
          message: "Cette réservation ne peut plus être annulée.",
        });
      }

      const updated = await prisma.reservation.update({
        where: { id: reservationId },
        data: { status: "CANCELLED" },
      });

      return res.json({
        message: "Réservation annulée.",
        reservation: updated,
      });
    } catch (error) {
      console.error("Cancel reservation error:", error);
      return res.status(500).json({ message: "Erreur interne du serveur" });
    }
  },
);

export default router;
