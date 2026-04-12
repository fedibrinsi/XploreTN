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

// ─── GET /api/housings/search ──────────────────────────────────────────────────
//
// Public endpoint — no authentication required.
// Returns all housings that match the provided filters.
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

router.get("/search", async (req: Request, res: Response) => {
  try {
    const search = str(req.query.search).trim();
    const location = str(req.query.location).trim();
    const typesRaw = str(req.query.types).trim();
    const sortByRaw = str(req.query.sortBy).trim() as SortBy;

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

    // ── Build Prisma where clause ─────────────────────────────────────────────
    const where: any = {};

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
      // Optionally limit results — uncomment to paginate
      // take: 50,
    });

    return res.json(housings);
  } catch (error) {
    console.error("Housing search error:", error);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

// ─── GET /api/housings/search/locations ───────────────────────────────────────
//
// Returns a deduplicated list of all distinct location strings.
// Useful for autocomplete in the location filter.

router.get("/search/locations", async (_req: Request, res: Response) => {
  try {
    const results = await prisma.housing.findMany({
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

// ─── GET /api/housings/search/stats ───────────────────────────────────────────
//
// Returns aggregate stats for the explore page hero section.

router.get("/search/stats", async (_req: Request, res: Response) => {
  try {
    const [total, aggregate] = await Promise.all([
      prisma.housing.count(),
      prisma.housing.aggregate({
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
