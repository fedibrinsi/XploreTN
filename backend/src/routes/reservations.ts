import express from "express";
import { Request, Response } from "express";
import prisma from "../prisma";
import { authenticateJWT, AuthRequest } from "../middleware/auth";
import { createHousingNotification } from "./notifications";

const router = express.Router();

// ─── POST /api/reservations ────────────────────────────────────────────────────
// Creates a PENDING reservation for a housing
router.post("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const touristId = (req as AuthRequest).user!.userId;
    const { housingId, startDate, endDate } = req.body;

    if (!housingId) {
      return res.status(400).json({ message: "housingId est requis." });
    }

    const housing = await prisma.housing.findUnique({
      where: { id: housingId },
    });
    if (!housing) {
      return res.status(404).json({ message: "Logement introuvable." });
    }

    if (housing.ownerId === touristId) {
      return res.status(403).json({
        message: "Vous ne pouvez pas réserver votre propre logement.",
      });
    }

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

    const start = startDate ? new Date(startDate) : new Date();
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

    await createHousingNotification({
      userId: housing.ownerId,
      housingId,
      reservationId: reservation.id,
      type: "RESERVATION_REQUESTED",
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
router.get("/my", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const touristId = (req as AuthRequest).user!.userId;

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
            rooms: true,
            maxTourists: true,
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
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const ownerId = (req as AuthRequest).user!.userId;
      const housingId = String(req.params.housingId);

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
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const ownerId = (req as AuthRequest).user!.userId;
      const reservationId = String(req.params.id);
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

      await createHousingNotification({
        userId: reservation.touristId,
        housingId: reservation.housingId,
        reservationId: reservation.id,
        type:
          status === "ACCEPTED"
            ? "RESERVATION_ACCEPTED"
            : "RESERVATION_REJECTED",
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

// ─── PATCH /api/reservations/:id/complete ─────────────────────────────────────
// Owner marks an ACCEPTED reservation as COMPLETED → housing becomes available again
router.patch(
  "/:id/complete",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const ownerId = (req as AuthRequest).user!.userId;
      const reservationId = String(req.params.id);

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
      if (reservation.status !== "ACCEPTED") {
        return res.status(400).json({
          message:
            "Seules les réservations acceptées peuvent être marquées comme terminées.",
        });
      }

      const updated = await prisma.reservation.update({
        where: { id: reservationId },
        data: { status: "COMPLETED" },
        include: {
          tourist: {
            select: { id: true, fullName: true, email: true, image: true },
          },
        },
      });

      await createHousingNotification({
        userId: reservation.touristId,
        housingId: reservation.housingId,
        reservationId: reservation.id,
        type: "RESERVATION_COMPLETED",
      });

      return res.json({
        message:
          "Séjour marqué comme terminé. Le logement est de nouveau disponible.",
        reservation: updated,
      });
    } catch (error) {
      console.error("Complete reservation error:", error);
      return res.status(500).json({ message: "Erreur interne du serveur" });
    }
  },
);

// ─── PATCH /api/reservations/:id/cancel ───────────────────────────────────────
// Tourist cancels their own reservation
router.patch(
  "/:id/cancel",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const touristId = (req as AuthRequest).user!.userId;
      const reservationId = String(req.params.id);

      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: { housing: true },
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

      await createHousingNotification({
        userId: reservation.housing.ownerId, // inclure housing dans le findUnique
        housingId: reservation.housingId,
        reservationId: reservation.id,
        type: "RESERVATION_CANCELLED",
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
