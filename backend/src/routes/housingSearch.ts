import express from "express";
import { Request, Response } from "express";
import prisma from "../prisma";

const router = express.Router();

// ─── Types ────────────────────────────────────────────────────────────────────

const VALID_HOUSING_TYPES = [
  "APARTMENT",
  "VILLA",
  "STUDIO",
  "TRADITIONAL_HOUSE",
  "FARM_STAY",
  "GUESTHOUSE",
  "RIAD",
  "CHALET",
] as const;

type HousingType = (typeof VALID_HOUSING_TYPES)[number];

type SortBy = "newest" | "oldest" | "maxTourists" | "maxStayDays" | "rooms";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function str(val: unknown): string {
  if (Array.isArray(val)) return String(val[0] ?? "");
  return String(val ?? "");
}

function intOrUndefined(val: unknown): number | undefined {
  const n = parseInt(str(val), 10);
  return isNaN(n) ? undefined : n;
}

function buildOrderBy(sortBy: SortBy): object {
  switch (sortBy) {
    case "oldest":
      return { createdAt: "asc" };
    case "maxTourists":
      return { maxTourists: "desc" };
    case "maxStayDays":
      return { maxStayDays: "desc" };
    case "rooms":
      return { rooms: "desc" };
    case "newest":
    default:
      return { createdAt: "desc" };
  }
}

// ─── GET /api/housingSearch/search ────────────────────────────────────────────
//
// Public endpoint — no authentication required.
// Returns only housings that have NO active (PENDING or ACCEPTED) reservation.
//
// Query parameters:
//   search       – free-text search in title, description, location
//   location     – partial match on location field
//   types        – comma-separated list of HousingType values
//   minRooms     – minimum number of rooms (inclusive)
//   maxRooms     – maximum number of rooms (inclusive)
//   minTourists  – minimum maxTourists capacity
//   maxTourists  – maximum maxTourists capacity
//   minStayDays  – minimum maxStayDays
//   maxStayDays  – maximum maxStayDays
//   sortBy       – "newest" | "oldest" | "maxTourists" | "maxStayDays" | "rooms"
//   excludeReservedBy – userId (number): also hide housings this user already requested

router.get("/search", async (req: Request, res: Response) => {
  try {
    const search = str(req.query.search).trim();
    const location = str(req.query.location).trim();
    const typesRaw = str(req.query.types).trim();
    const sortByRaw = str(req.query.sortBy).trim() as SortBy;
    const excludeReservedByRaw = intOrUndefined(req.query.excludeReservedBy);

    const minRooms = intOrUndefined(req.query.minRooms);
    const maxRooms = intOrUndefined(req.query.maxRooms);
    const minTourists = intOrUndefined(req.query.minTourists);
    const maxTourists = intOrUndefined(req.query.maxTourists);
    const minStayDays = intOrUndefined(req.query.minStayDays);
    const maxStayDays = intOrUndefined(req.query.maxStayDays);

    // Parse and validate housing types
    let types: HousingType[] | undefined;
    if (typesRaw) {
      const parsed = typesRaw
        .split(",")
        .map((t) => t.trim().toUpperCase())
        .filter((t) =>
          VALID_HOUSING_TYPES.includes(t as HousingType),
        ) as HousingType[];
      if (parsed.length > 0) types = parsed;
    }

    // Validate sortBy
    const VALID_SORT: SortBy[] = [
      "newest",
      "oldest",
      "maxTourists",
      "maxStayDays",
      "rooms",
    ];
    const sortBy: SortBy = VALID_SORT.includes(sortByRaw)
      ? sortByRaw
      : "newest";

    // ── Find housing IDs with active reservations (PENDING or ACCEPTED) ──────
    // These housings are considered "taken" and must be excluded
    const activeReservations = await prisma.reservation.findMany({
      where: {
        status: { in: ["PENDING", "ACCEPTED"] },
      },
      select: { housingId: true },
      distinct: ["housingId"],
    });
    const reservedHousingIds = activeReservations.map((r) => r.housingId);

    // ── Build Prisma where clause ─────────────────────────────────────────────
    const where: any = {};

    // Exclude all housings with active reservations
    if (reservedHousingIds.length > 0) {
      where.id = { notIn: reservedHousingIds };
    }

    // Free-text search across title, description, location
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    // Location filter (independent from full-text search)
    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    // Type filter
    if (types && types.length > 0) {
      where.type = { in: types };
    }

    // Rooms range
    if (minRooms != null || maxRooms != null) {
      where.rooms = {};
      if (minRooms != null) where.rooms.gte = minRooms;
      if (maxRooms != null) where.rooms.lte = maxRooms;
    }

    // Tourists capacity range
    if (minTourists != null || maxTourists != null) {
      where.maxTourists = {};
      if (minTourists != null) where.maxTourists.gte = minTourists;
      if (maxTourists != null) where.maxTourists.lte = maxTourists;
    }

    // Stay duration range
    if (minStayDays != null || maxStayDays != null) {
      where.maxStayDays = {};
      if (minStayDays != null) where.maxStayDays.gte = minStayDays;
      if (maxStayDays != null) where.maxStayDays.lte = maxStayDays;
    }

    const housings = await prisma.housing.findMany({
      where,
      orderBy: buildOrderBy(sortBy),
    });

    return res.json(housings);
  } catch (error) {
    console.error("Housing search error:", error);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

// ─── GET /api/housingSearch/search/locations ───────────────────────────────────
//
// Returns a deduplicated list of all distinct location strings (only available housings).

router.get("/search/locations", async (_req: Request, res: Response) => {
  try {
    // Only show locations of available (non-reserved) housings
    const activeReservations = await prisma.reservation.findMany({
      where: { status: { in: ["PENDING", "ACCEPTED"] } },
      select: { housingId: true },
      distinct: ["housingId"],
    });
    const reservedIds = activeReservations.map((r) => r.housingId);

    const results = await prisma.housing.findMany({
      where:
        reservedIds.length > 0 ? { id: { notIn: reservedIds } } : undefined,
      select: { location: true },
      distinct: ["location"],
      orderBy: { location: "asc" },
    });

    const locations = results.map((r) => r.location);
    return res.json(locations);
  } catch (error) {
    console.error("Housing locations error:", error);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

// ─── GET /api/housingSearch/search/stats ──────────────────────────────────────
//
// Returns aggregate stats for the explore page hero section (available housings only).

router.get("/search/stats", async (_req: Request, res: Response) => {
  try {
    // Exclude housings with active reservations
    const activeReservations = await prisma.reservation.findMany({
      where: { status: { in: ["PENDING", "ACCEPTED"] } },
      select: { housingId: true },
      distinct: ["housingId"],
    });
    const reservedIds = activeReservations.map((r) => r.housingId);

    const whereClause =
      reservedIds.length > 0 ? { id: { notIn: reservedIds } } : {};

    const [total, aggregate] = await Promise.all([
      prisma.housing.count({ where: whereClause }),
      prisma.housing.aggregate({
        where: whereClause,
        _sum: { maxTourists: true, rooms: true },
        _avg: { maxStayDays: true },
      }),
    ]);

    return res.json({
      total,
      totalCapacity: aggregate._sum.maxTourists ?? 0,
      totalRooms: aggregate._sum.rooms ?? 0,
      avgStayDays: Math.round(aggregate._avg.maxStayDays ?? 0),
    });
  } catch (error) {
    console.error("Housing stats error:", error);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

export default router;
