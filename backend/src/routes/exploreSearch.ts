import { Router, Request, Response } from "express";

const router = Router();

// ─── Types ─────────────────────────────────────────────────────────────────────

type PlaceCategory =
  | "RESTAURANT"
  | "CAFE"
  | "TEA_HOUSE"
  | "SHOP"
  | "BEAUTY_SALON"
  | "PHARMACY"
  | "BAKERY"
  | "MARKET";

const VALID_CATEGORIES: PlaceCategory[] = [
  "RESTAURANT",
  "CAFE",
  "TEA_HOUSE",
  "SHOP",
  "BEAUTY_SALON",
  "PHARMACY",
  "BAKERY",
  "MARKET",
];

const VALID_SORT = ["distance", "rating", "name"] as const;
type SortOption = (typeof VALID_SORT)[number];

// ─── Mapping catégorie → tags OSM ─────────────────────────────────────────────

const CATEGORY_TO_OSM: Record<PlaceCategory, { key: string; value: string }[]> =
  {
    RESTAURANT: [{ key: "amenity", value: "restaurant" }],
    CAFE: [{ key: "amenity", value: "cafe" }],
    TEA_HOUSE: [
      { key: "amenity", value: "cafe" },
      { key: "shop", value: "tea" },
    ],
    SHOP: [
      { key: "shop", value: "convenience" },
      { key: "shop", value: "general" },
    ],
    BEAUTY_SALON: [
      { key: "shop", value: "beauty" },
      { key: "shop", value: "hairdresser" },
    ],
    PHARMACY: [{ key: "amenity", value: "pharmacy" }],
    BAKERY: [{ key: "shop", value: "bakery" }],
    MARKET: [
      { key: "shop", value: "supermarket" },
      { key: "amenity", value: "marketplace" },
    ],
  };

function osmTagToCategory(tags: Record<string, string>): PlaceCategory | null {
  if (tags.amenity === "restaurant") return "RESTAURANT";
  if (tags.amenity === "cafe") return "CAFE";
  if (tags.shop === "tea") return "TEA_HOUSE";
  if (tags.shop === "bakery") return "BAKERY";
  if (tags.amenity === "pharmacy") return "PHARMACY";
  if (tags.shop === "beauty" || tags.shop === "hairdresser")
    return "BEAUTY_SALON";
  if (tags.shop === "supermarket" || tags.amenity === "marketplace")
    return "MARKET";
  if (tags.shop === "convenience" || tags.shop === "general") return "SHOP";
  return null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocodeWithNominatim(
  location: string,
): Promise<{ lat: number; lng: number } | null> {
  const coordMatch = location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (coordMatch) {
    return { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
  }
  try {
    const params = new URLSearchParams({
      q: location,
      format: "json",
      limit: "1",
    });
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: { "User-Agent": "XploreTN/1.0", "Accept-Language": "fr,en" },
      },
    );
    if (!res.ok) return null;
    const data: Array<{ lat: string; lon: string }> = await res.json();
    if (!data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (err) {
    console.error("[geocode] Error:", err);
    return null;
  }
}

// ─── Overpass API ──────────────────────────────────────────────────────────────

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

async function fetchFromOverpass(
  lat: number,
  lng: number,
  radiusMeters: number,
  categories: PlaceCategory[],
): Promise<OverpassElement[]> {
  const filters = categories.flatMap((cat) =>
    CATEGORY_TO_OSM[cat].map(
      ({ key, value }) =>
        `node["${key}"="${value}"](around:${radiusMeters},${lat},${lng});\n` +
        `way["${key}"="${value}"](around:${radiusMeters},${lat},${lng});`,
    ),
  );

  const query = `[out:json][timeout:25];\n(\n${filters.join("\n")}\n);\nout center tags;`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  const json = (await res.json()) as { elements: OverpassElement[] };
  return json.elements ?? [];
}

// ─── Transformer un élément Overpass en Place ──────────────────────────────────

interface PlaceResult {
  id: string;
  name: string;
  category: PlaceCategory;
  address: string;
  city: string;
  distance: number;
  rating: null;
  reviewCount: null;
  isOpen: null;
  phone: string | null;
  website: string | null;
  tags: string[];
  image: null;
  lat: number;
  lng: number;
}

function overpassToPlace(
  el: OverpassElement,
  originLat: number,
  originLng: number,
): PlaceResult | null {
  const tags = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat == null || lng == null) return null;

  const name = tags.name || tags["name:fr"] || tags["name:ar"] || null;
  if (!name) return null;

  const category = osmTagToCategory(tags);
  if (!category) return null;

  const distance = Math.round(haversineMeters(originLat, originLng, lat, lng));

  const address =
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ") ||
    tags["addr:full"] ||
    "";
  const city =
    tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"] ?? "";

  const extraTags: string[] = [];
  if (tags.cuisine)
    extraTags.push(...tags.cuisine.split(";").map((s) => s.trim()));
  if (tags.wheelchair === "yes") extraTags.push("Accessible");
  if (tags.internet_access === "wlan") extraTags.push("Wi-Fi");
  if (tags.outdoor_seating === "yes") extraTags.push("Terrasse");
  if (tags.takeaway === "yes") extraTags.push("À emporter");
  if (tags.delivery === "yes") extraTags.push("Livraison");

  return {
    id: String(el.id),
    name,
    category,
    address,
    city,
    distance,
    rating: null,
    reviewCount: null,
    isOpen: null,
    phone: tags.phone ?? tags["contact:phone"] ?? null,
    website: tags.website ?? tags["contact:website"] ?? null,
    tags: extraTags.slice(0, 5),
    image: null,
    lat,
    lng,
  };
}

// ─── Validation middleware ─────────────────────────────────────────────────────

function validateSearchQuery(
  req: Request,
  res: Response,
  next: () => void,
): void {
  const { location, radius, categories } = req.query as Record<string, string>;

  if (!location?.trim()) {
    res.status(400).json({ error: "Le paramètre 'location' est requis." });
    return;
  }

  const radiusNum = radius ? parseInt(radius, 10) : 1000;
  if (isNaN(radiusNum) || radiusNum < 50 || radiusNum > 50_000) {
    res
      .status(400)
      .json({
        error: "Le paramètre 'radius' doit être entre 50 et 50 000 mètres.",
      });
    return;
  }

  if (categories) {
    const cats = categories.split(",").map((c) => c.trim().toUpperCase());
    const invalid = cats.filter(
      (c) => !VALID_CATEGORIES.includes(c as PlaceCategory),
    );
    if (invalid.length) {
      res.status(400).json({
        error: `Catégories invalides : ${invalid.join(", ")}. Valeurs acceptées : ${VALID_CATEGORIES.join(", ")}`,
      });
      return;
    }
  }

  next();
}

// ─── GET /api/exploreSearch/search ────────────────────────────────────────────

/**
 * @route   GET /api/exploreSearch/search
 * @desc    Cherche des lieux proches via Overpass API (OpenStreetMap)
 * @access  Public
 *
 * Query params:
 *   location    string   Requis. Nom de ville ou "lat,lng"
 *   lat         number   Optionnel. Latitude explicite (court-circuite le géocodage)
 *   lng         number   Optionnel. Longitude explicite
 *   radius      number   Optionnel. Rayon en mètres (défaut 1000, max 50000)
 *   categories  string   Optionnel. Catégories séparées par virgule
 *   sortBy      string   Optionnel. "distance" | "name" (défaut "distance")
 *   limit       number   Optionnel. Max résultats (défaut 50, max 200)
 */
router.get(
  "/search",
  validateSearchQuery,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        location,
        lat,
        lng,
        radius = "1000",
        categories,
        sortBy = "distance",
        limit = "50",
      } = req.query as Record<string, string>;

      // ── 1. Résoudre les coordonnées ─────────────────────────────────────────
      let coords: { lat: number; lng: number } | null = null;

      if (lat && lng) {
        const pLat = parseFloat(lat);
        const pLng = parseFloat(lng);
        if (!isNaN(pLat) && !isNaN(pLng)) coords = { lat: pLat, lng: pLng };
      }

      if (!coords) coords = await geocodeWithNominatim(location);

      if (!coords) {
        res.status(422).json({
          error: `Impossible de géocoder "${location}". Utilisez le format "lat,lng" ou un nom de ville.`,
        });
        return;
      }

      // ── 2. Parser les catégories ────────────────────────────────────────────
      const parsedCategories: PlaceCategory[] = categories
        ? categories
            .split(",")
            .map((c) => c.trim().toUpperCase() as PlaceCategory)
            .filter((c) => VALID_CATEGORIES.includes(c))
        : [...VALID_CATEGORIES];

      const radiusMeters = parseInt(radius, 10);
      const maxResults = Math.min(parseInt(limit, 10) || 50, 200);

      // ── 3. Appel Overpass API ───────────────────────────────────────────────
      const elements = await fetchFromOverpass(
        coords.lat,
        coords.lng,
        radiusMeters,
        parsedCategories,
      );

      // ── 4. Transformer, dédupliquer, trier ─────────────────────────────────
      const seen = new Set<string>();
      const places: PlaceResult[] = [];

      for (const el of elements) {
        const place = overpassToPlace(el, coords.lat, coords.lng);
        if (!place) continue;
        const key = `${place.name.toLowerCase()}|${place.city.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        places.push(place);
      }

      const validSort: SortOption = VALID_SORT.includes(sortBy as SortOption)
        ? (sortBy as SortOption)
        : "distance";

      places.sort((a, b) => {
        if (validSort === "name") return a.name.localeCompare(b.name, "fr");
        return a.distance - b.distance;
      });

      res.json(places.slice(0, maxResults));
    } catch (err) {
      console.error("[exploreSearch/search] Error:", err);
      res.status(500).json({ error: "Erreur serveur interne." });
    }
  },
);

// ─── GET /api/exploreSearch/:id ───────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const query = `[out:json][timeout:10];\n(node(${id}); way(${id}););\nout center tags;`;

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      res.status(502).json({ error: "Erreur Overpass API." });
      return;
    }

    const json = (await response.json()) as { elements: OverpassElement[] };
    const el = json.elements?.[0];

    if (!el) {
      res.status(404).json({ error: "Lieu introuvable." });
      return;
    }

    const tags = el.tags ?? {};
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;

    res.json({
      id: String(el.id),
      name: tags.name ?? tags["name:fr"] ?? "Sans nom",
      category: osmTagToCategory(tags),
      address: [tags["addr:housenumber"], tags["addr:street"]]
        .filter(Boolean)
        .join(" "),
      city: tags["addr:city"] ?? tags["addr:town"] ?? "",
      lat,
      lng,
      phone: tags.phone ?? tags["contact:phone"] ?? null,
      website: tags.website ?? tags["contact:website"] ?? null,
      openingHours: tags.opening_hours ?? null,
      tags: Object.entries(tags)
        .filter(([k]) =>
          [
            "cuisine",
            "wheelchair",
            "internet_access",
            "outdoor_seating",
          ].includes(k),
        )
        .map(([k, v]) => `${k}: ${v}`),
    });
  } catch (err) {
    console.error("[exploreSearch/:id] Error:", err);
    res.status(500).json({ error: "Erreur serveur interne." });
  }
});

export default router;
