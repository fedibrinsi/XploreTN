import { useState, useRef, useCallback, useEffect } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type PlaceCategory =
  | "RESTAURANT"
  | "CAFE"
  | "TEA_HOUSE"
  | "SHOP"
  | "BEAUTY_SALON"
  | "PHARMACY"
  | "BAKERY"
  | "MARKET";

export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  RESTAURANT: "Restaurant",
  CAFE: "Café",
  TEA_HOUSE: "Tea House",
  SHOP: "Shop",
  BEAUTY_SALON: "Beauty Salon",
  PHARMACY: "Pharmacy",
  BAKERY: "Bakery",
  MARKET: "Market",
};

export const CATEGORY_ICONS: Record<PlaceCategory, string> = {
  RESTAURANT: "restaurant",
  CAFE: "local_cafe",
  TEA_HOUSE: "emoji_food_beverage",
  SHOP: "storefront",
  BEAUTY_SALON: "spa",
  PHARMACY: "local_pharmacy",
  BAKERY: "bakery_dining",
  MARKET: "shopping_basket",
};

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  address: string;
  city: string;
  distance?: number;
  rating?: number | null;
  reviewCount?: number | null;
  isOpen?: boolean | null;
  phone?: string | null;
  website?: string | null;
  tags?: string[];
  image?: string | null;
  lat?: number;
  lng?: number;
}

export interface ExploreFilters {
  location: string;
  latitude?: number;
  longitude?: number;
  categories: PlaceCategory[];
  radiusMeters: number;
}

// ─── Nominatim types & helpers ─────────────────────────────────────────────────

interface NominatimSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
  };
}

async function searchNominatim(query: string): Promise<NominatimSuggestion[]> {
  if (!query.trim() || query.length < 2) return [];
  const params = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    limit: "6",
  });
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: { "Accept-Language": "fr,en" },
      },
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function geocodeQuery(
  query: string,
): Promise<{ lat: number; lng: number } | null> {
  const coordMatch = query.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (coordMatch)
    return { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
  const results = await searchNominatim(query);
  if (!results.length) return null;
  return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
}

function formatMain(s: NominatimSuggestion): string {
  const a = s.address ?? {};
  return (
    a.city ?? a.town ?? a.village ?? s.name ?? s.display_name.split(",")[0]
  );
}

function formatSecondary(s: NominatimSuggestion): string {
  return s.display_name
    .split(",")
    .slice(1, 4)
    .map((p) => p.trim())
    .join(", ");
}

// ─── API ───────────────────────────────────────────────────────────────────────

const BASE_URL = (import.meta.env.VITE_API_URL ??
  "http://localhost:5000/api") as string;

async function searchPlaces(filters: ExploreFilters): Promise<Place[]> {
  // Toujours envoyer lat/lng si disponibles pour éviter le géocodage côté backend
  const params = new URLSearchParams({
    location: filters.location,
    radius: String(filters.radiusMeters),
    categories: filters.categories.join(","),
  });
  if (filters.latitude != null) params.set("lat", String(filters.latitude));
  if (filters.longitude != null) params.set("lng", String(filters.longitude));

  const res = await fetch(`${BASE_URL}/exploreSearch/search?${params}`);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatRadius(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// ─── LocationAutocomplete ──────────────────────────────────────────────────────

function LocationAutocomplete({
  value,
  onChange,
  onEnter,
}: {
  value: string;
  onChange: (value: string, coords?: { lat: number; lng: number }) => void;
  onEnter?: () => void;
}) {
  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    setLoading(true);
    const results = await searchNominatim(q);
    setSuggestions(results);
    setIsOpen(results.length > 0);
    setLoading(false);
  }, []);

  const handleInput = (val: string) => {
    onChange(val);
    setActiveIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim() || val.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 350);
  };

  const selectSuggestion = (s: NominatimSuggestion) => {
    const label = `${formatMain(s)}, ${formatSecondary(s)}`;
    const coords = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
    onChange(label, coords);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIdx(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (isOpen && activeIdx >= 0) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIdx]);
      } else onEnter?.();
      return;
    }
    if (!isOpen || !suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIdx(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline-variant text-[20px] pointer-events-none">
          location_on
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder="City, neighborhood or address…"
          autoComplete="off"
          className="w-full bg-surface-container-low border border-surface-variant/40 rounded-2xl pl-11 pr-10 py-3.5 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {loading ? (
            <span className="material-symbols-outlined text-base text-primary animate-spin pointer-events-none">
              refresh
            </span>
          ) : value ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setSuggestions([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="text-outline-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          ) : null}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-surface-container-lowest border border-surface-variant/40 rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden">
          <ul className="py-1.5 max-h-64 overflow-y-auto">
            {suggestions.map((s, i) => (
              <li key={s.place_id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(s)}
                  onMouseEnter={() => setActiveIdx(i)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                    i === activeIdx
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-surface-container-low text-on-surface"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-base mt-0.5 flex-shrink-0 ${i === activeIdx ? "text-primary" : "text-tertiary"}`}
                  >
                    location_on
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug truncate">
                      {formatMain(s)}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">
                      {formatSecondary(s)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="px-4 py-2 border-t border-surface-variant/20 flex items-center justify-end">
            <span className="text-[10px] text-outline-variant">
              © OpenStreetMap contributors
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Category Chip ─────────────────────────────────────────────────────────────

function CategoryChip({
  category,
  selected,
  onClick,
}: {
  category: PlaceCategory;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border ${
        selected
          ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-[1.03]"
          : "bg-surface-container-low border-surface-variant/40 text-on-surface-variant hover:border-primary/50 hover:text-primary"
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">
        {CATEGORY_ICONS[category]}
      </span>
      {CATEGORY_LABELS[category]}
    </button>
  );
}

// ─── Radius Slider ─────────────────────────────────────────────────────────────

function RadiusSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const MIN = 200,
    MAX = 10000;
  const pct = ((value - MIN) / (MAX - MIN)) * 100;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          Search radius
        </span>
        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {formatRadius(value)}
        </span>
      </div>
      <div className="relative h-1.5 bg-surface-container-high rounded-full">
        <div
          className="absolute h-full bg-primary rounded-full"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md pointer-events-none"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-on-surface-variant font-medium">
        <span>200 m</span>
        <span>10 km</span>
      </div>
    </div>
  );
}

// ─── Place Card ────────────────────────────────────────────────────────────────

function PlaceCard({
  place,
  onSelect,
}: {
  place: Place;
  onSelect: (p: Place) => void;
}) {
  return (
    <article
      onClick={() => onSelect(place)}
      className="group bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-lg shadow-primary/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-surface-variant/20 flex flex-col cursor-pointer hover:-translate-y-1"
    >
      {/* Image placeholder with icon */}
      <div className="relative h-40 overflow-hidden bg-surface-container-high flex items-center justify-center">
        <span className="material-symbols-outlined text-6xl text-outline-variant">
          {CATEGORY_ICONS[place.category]}
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">
            {CATEGORY_ICONS[place.category]}
          </span>
          {CATEGORY_LABELS[place.category]}
        </span>

        {place.distance != null && (
          <div className="absolute bottom-3 left-3">
            <span className="text-white/90 text-[11px] font-bold bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">near_me</span>
              {formatDistance(place.distance)}
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-2">
        <div>
          <h3 className="font-headline text-base font-bold text-primary leading-snug group-hover:text-tertiary transition-colors line-clamp-1">
            {place.name}
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">
              location_on
            </span>
            {[place.address, place.city].filter(Boolean).join(", ") ||
              "Adresse non renseignée"}
          </p>
        </div>

        {place.phone && (
          <p className="text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">call</span>
            {place.phone}
          </p>
        )}

        {place.tags && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {place.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <button className="mt-2 w-full py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all duration-200 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm">open_in_new</span>
          View details
        </button>
      </div>
    </article>
  );
}

// ─── Place Detail Modal ────────────────────────────────────────────────────────

function PlaceDetailModal({
  place,
  onClose,
}: {
  place: Place;
  onClose: () => void;
}) {
  const mapsUrl =
    place.lat && place.lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 bg-surface-container-lowest w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl shadow-primary/20 border border-surface-variant/20">
        <div className="flex justify-center pt-4 pb-1 sm:hidden">
          <div className="w-10 h-1.5 rounded-full bg-outline-variant" />
        </div>

        <div className="p-8 pt-6">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-tertiary mb-2">
                <span className="material-symbols-outlined text-sm">
                  {CATEGORY_ICONS[place.category]}
                </span>
                {CATEGORY_LABELS[place.category]}
              </span>
              <h2 className="font-headline text-2xl font-bold text-primary">
                {place.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 bg-surface-container-high rounded-full flex items-center justify-center shrink-0 hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Distance card */}
          {place.distance != null && (
            <div className="bg-surface-container-low rounded-2xl p-4 text-center border border-surface-variant/20 mb-6">
              <span className="material-symbols-outlined text-primary text-xl mb-1 block">
                near_me
              </span>
              <p className="font-headline text-lg font-black text-primary">
                {formatDistance(place.distance)}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mt-0.5">
                Distance
              </p>
            </div>
          )}

          {/* Address */}
          <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-2xl border border-surface-variant/20 mb-4">
            <span className="material-symbols-outlined text-primary">
              location_on
            </span>
            <p className="text-sm text-on-surface-variant">
              {[place.address, place.city].filter(Boolean).join(", ") ||
                "Adresse non renseignée"}
            </p>
          </div>

          {/* Phone */}
          {place.phone && (
            <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-2xl border border-surface-variant/20 mb-4">
              <span className="material-symbols-outlined text-primary">
                call
              </span>
              <a
                href={`tel:${place.phone}`}
                className="text-sm font-bold text-primary hover:underline"
              >
                {place.phone}
              </a>
            </div>
          )}

          {/* Website */}
          {place.website && (
            <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-2xl border border-surface-variant/20 mb-4">
              <span className="material-symbols-outlined text-primary">
                language
              </span>
              <a
                href={place.website}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-bold text-primary hover:underline truncate"
              >
                {place.website}
              </a>
            </div>
          )}

          {/* Tags */}
          {place.tags && place.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {place.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {place.phone && (
              <a
                href={`tel:${place.phone}`}
                className="flex-1 py-4 rounded-xl border border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">
                  call
                </span>
                Call
              </a>
            )}
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-4 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">
                  near_me
                </span>
                Directions
              </a>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 py-4 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">
                  close
                </span>
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-lg border border-surface-variant/20 flex flex-col animate-pulse">
      <div className="h-40 bg-surface-container-high" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-4 w-2/3 bg-surface-container-high rounded-full" />
        <div className="h-3 w-full bg-surface-container-high rounded-full" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-4 w-12 bg-surface-container-high rounded-full"
            />
          ))}
        </div>
        <div className="h-8 bg-surface-container-high rounded-xl mt-1" />
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="material-symbols-outlined text-7xl text-outline-variant mb-6">
        search_off
      </span>
      <h2 className="font-headline text-3xl text-primary mb-2">
        No places found
      </h2>
      <p className="text-on-surface-variant mb-6 max-w-sm">
        Try expanding the radius, changing your location, or selecting different
        categories.
      </p>
      <button
        onClick={onReset}
        className="flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:scale-[1.03] transition-all shadow-lg shadow-primary/20"
      >
        <span className="material-symbols-outlined">refresh</span>
        Reset
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const ALL_CATEGORIES: PlaceCategory[] = [
  "RESTAURANT",
  "CAFE",
  "TEA_HOUSE",
  "SHOP",
  "BEAUTY_SALON",
  "PHARMACY",
  "BAKERY",
  "MARKET",
];

const DEFAULT_FILTERS: ExploreFilters = {
  location: "",
  categories: [],
  radiusMeters: 1000,
};

type SortOption = "distance" | "name";

function sortPlaces(places: Place[], by: SortOption): Place[] {
  return [...places].sort((a, b) => {
    if (by === "name") return a.name.localeCompare(b.name);
    return (a.distance ?? Infinity) - (b.distance ?? Infinity);
  });
}

export default function ExplorePage() {
  const [filters, setFilters] = useState<ExploreFilters>(DEFAULT_FILTERS);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selected, setSelected] = useState<Place | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("distance");
  const [gpsLoading, setGpsLoading] = useState(false);

  // ── doSearch ──────────────────────────────────────────────────────────────────
  const doSearch = useCallback(async (f: ExploreFilters) => {
    if (!f.location.trim() || !f.categories.length) return;

    let resolved = { ...f };

    // Si pas encore de coordonnées, géocoder via Nominatim côté frontend
    if (resolved.latitude == null || resolved.longitude == null) {
      const geo = await geocodeQuery(f.location);
      if (geo) {
        resolved.latitude = geo.lat;
        resolved.longitude = geo.lng;
      }
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await searchPlaces(resolved);
      setPlaces(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load results. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // ── GPS ───────────────────────────────────────────────────────────────────────
  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        setFilters((f) => ({
          ...f,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          location: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        }));
      },
      () => setGpsLoading(false),
    );
  };

  const handleLocationChange = (
    value: string,
    coords?: { lat: number; lng: number },
  ) => {
    setFilters((f) => ({
      ...f,
      location: value,
      latitude: coords?.lat,
      longitude: coords?.lng,
    }));
  };

  const toggleCategory = (cat: PlaceCategory) => {
    setFilters((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setPlaces([]);
    setHasSearched(false);
    setError(null);
  };

  const sortedPlaces = sortPlaces(places, sortBy);
  const canSearch =
    filters.location.trim().length > 0 && filters.categories.length > 0;

  return (
    <>
      <div className="pt-24 pb-32 min-h-screen px-4 md:px-8 max-w-[1000px] mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-tertiary mb-2">
            Discover Tunisia
          </p>
          <h1 className="font-headline text-4xl sm:text-5xl font-black text-primary leading-tight">
            Explore <span className="italic font-normal">near you</span>
          </h1>
          <p className="text-on-surface-variant mt-2 text-base">
            Restaurants, cafés, shops and more — powered by OpenStreetMap.
          </p>
        </div>

        {/* Search Panel */}
        <div className="bg-surface-container-lowest rounded-[2rem] border border-surface-variant/20 shadow-lg shadow-primary/5 p-6 sm:p-8 space-y-7">
          {/* Location */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Your location
            </label>
            <div className="flex gap-3">
              <LocationAutocomplete
                value={filters.location}
                onChange={handleLocationChange}
                onEnter={() => doSearch(filters)}
              />
              <button
                onClick={handleGPS}
                disabled={gpsLoading}
                title="Use my GPS position"
                className="w-14 h-14 shrink-0 rounded-2xl border border-surface-variant/40 bg-surface-container-low text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center disabled:opacity-50"
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${gpsLoading ? "animate-spin" : ""}`}
                >
                  {gpsLoading ? "sync" : "my_location"}
                </span>
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                What are you looking for?
              </label>
              {filters.categories.length > 0 && (
                <button
                  onClick={() => setFilters((f) => ({ ...f, categories: [] }))}
                  className="text-[10px] font-bold uppercase tracking-widest text-error hover:text-error/70 transition-colors"
                >
                  Deselect all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORIES.map((cat) => (
                <CategoryChip
                  key={cat}
                  category={cat}
                  selected={filters.categories.includes(cat)}
                  onClick={() => toggleCategory(cat)}
                />
              ))}
            </div>
            {filters.categories.length === 0 && (
              <p className="text-xs text-error/70 flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-sm">info</span>
                Select at least one category
              </p>
            )}
          </div>

          {/* Radius */}
          <RadiusSlider
            value={filters.radiusMeters}
            onChange={(v) => setFilters((f) => ({ ...f, radiusMeters: v }))}
          />

          {/* Search Button */}
          <button
            onClick={() => doSearch(filters)}
            disabled={!canSearch || loading}
            className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">
                  refresh
                </span>
                Searching…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">
                  search
                </span>
                Search nearby
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {hasSearched && (
          <div className="mt-10">
            {error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <span className="material-symbols-outlined text-6xl text-error/40">
                  cloud_off
                </span>
                <h2 className="font-headline text-2xl text-primary">
                  An error occurred
                </h2>
                <p className="text-on-surface-variant text-sm max-w-xs">
                  {error}
                </p>
                <button
                  onClick={() => doSearch(filters)}
                  className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:scale-[1.03] transition-all shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-sm">
                    refresh
                  </span>
                  Try again
                </button>
              </div>
            ) : loading ? (
              <>
                <div className="h-1 mb-8 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-primary rounded-full animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              </>
            ) : places.length === 0 ? (
              <EmptyState onReset={handleReset} />
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <p className="text-sm font-bold text-on-surface-variant bg-surface-container-low px-4 py-2 rounded-xl border border-surface-variant/30 self-start">
                    <span className="text-primary">{places.length}</span> place
                    {places.length > 1 ? "s" : ""} found · within{" "}
                    {formatRadius(filters.radiusMeters)} of{" "}
                    <span className="text-primary">{filters.location}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant">
                      Sort by:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="bg-surface-container-low border border-surface-variant/40 rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      <option value="distance">Closest</option>
                      <option value="name">Name A–Z</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sortedPlaces.map((p) => (
                    <PlaceCard key={p.id} place={p} onSelect={setSelected} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {selected && (
        <PlaceDetailModal place={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
