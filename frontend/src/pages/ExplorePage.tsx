import { useState, useRef, useCallback, useEffect } from "react";
import messageImg from "../assets/explore.jpg";
import { useSearch, useRecommendations, useMatchLocals } from "../hooks/useAI";
import ActivityCard from "../components/ActivityCard";
import MatchedLocalCard from "../components/MatchedLocalCard";
import type { EntityType } from "../types/ai.types";

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

export const CATEGORY_COLORS: Record<
  PlaceCategory,
  {
    photoBg: string;
    badgeBg: string;
    badgeText: string;
    actionLight: string;
    actionDark: string;
    tagBg: string;
    tagText: string;
  }
> = {
  RESTAURANT: {
    photoBg: "#FAECE7",
    badgeBg: "#F5C4B3",
    badgeText: "#712B13",
    actionLight: "#993C1D",
    actionDark: "#712B13",
    tagBg: "#FAECE7",
    tagText: "#712B13",
  },
  CAFE: {
    photoBg: "#E1F5EE",
    badgeBg: "#9FE1CB",
    badgeText: "#085041",
    actionLight: "#0F6E56",
    actionDark: "#085041",
    tagBg: "#E1F5EE",
    tagText: "#085041",
  },
  TEA_HOUSE: {
    photoBg: "#FAEEDA",
    badgeBg: "#FAC775",
    badgeText: "#633806",
    actionLight: "#854F0B",
    actionDark: "#633806",
    tagBg: "#FAEEDA",
    tagText: "#633806",
  },
  SHOP: {
    photoBg: "#E6F1FB",
    badgeBg: "#B5D4F4",
    badgeText: "#0C447C",
    actionLight: "#185FA5",
    actionDark: "#0C447C",
    tagBg: "#E6F1FB",
    tagText: "#0C447C",
  },
  BEAUTY_SALON: {
    photoBg: "#FBEAF0",
    badgeBg: "#F4C0D1",
    badgeText: "#72243E",
    actionLight: "#993556",
    actionDark: "#72243E",
    tagBg: "#FBEAF0",
    tagText: "#72243E",
  },
  PHARMACY: {
    photoBg: "#EEEDFE",
    badgeBg: "#CECBF6",
    badgeText: "#3C3489",
    actionLight: "#534AB7",
    actionDark: "#3C3489",
    tagBg: "#EEEDFE",
    tagText: "#3C3489",
  },
  BAKERY: {
    photoBg: "#FAEEDA",
    badgeBg: "#FAC775",
    badgeText: "#633806",
    actionLight: "#854F0B",
    actionDark: "#633806",
    tagBg: "#FAEEDA",
    tagText: "#633806",
  },
  MARKET: {
    photoBg: "#EAF3DE",
    badgeBg: "#C0DD97",
    badgeText: "#27500A",
    actionLight: "#3B6D11",
    actionDark: "#27500A",
    tagBg: "#EAF3DE",
    tagText: "#27500A",
  },
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

// ─── Nominatim ─────────────────────────────────────────────────────────────────

interface NominatimSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: { city?: string; town?: string; village?: string };
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

// ─── Hero Banner ───────────────────────────────────────────────────────────────

function HeroBanner() {
  return (
    <main className="pt-20 min-h-screen w-full bg-surface-container-low">
      <div className="w-full min-h-[calc(100vh-80px)] flex flex-col">
        {/* Hero Image */}
        <div className="w-full h-[45vh] relative overflow-hidden">
          <img
            src={messageImg}
            alt="Housing Hero"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Optional dark overlay */}
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Content Section */}
        <div className="flex-1 w-full bg-surface px-6 md:px-20 py-12 flex flex-col items-center justify-center gap-6">
          {/* Badge */}
          <div className="flex items-center gap-1.5 bg-amber-50 rounded-full px-4 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">
              Discover Nearby Places
            </span>
          </div>

          {/* Title */}
          <div className="text-center max-w-2xl">
            <h1 className="font-headline text-4xl md:text-5xl italic text-primary leading-tight mb-4">
              Explore Tunisia
            </h1>

            <p className="text-lg text-on-surface-variant leading-relaxed">
              Discover nearby places based on your location and explore the best
              restaurants, cafés, shops, and hidden gems around you.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
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

// ─── StarRating ────────────────────────────────────────────────────────────────

function StarRating({
  rating,
  reviewCount,
  color,
}: {
  rating: number;
  reviewCount?: number | null;
  color: string;
}) {
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="text-sm leading-none"
          style={{ color: i <= filled ? color : "#D3D1C7" }}
        >
          {i <= filled ? "★" : "☆"}
        </span>
      ))}
      <span className="text-xs text-on-surface-variant ml-1.5">
        {rating.toFixed(1)}
        {reviewCount ? ` · ${reviewCount} avis` : ""}
      </span>
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
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const colors = CATEGORY_COLORS[place.category];
  const mapsUrl =
    place.lat && place.lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
      : null;

  return (
    <article
      onClick={() => onSelect(place)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group bg-surface-container-lowest rounded-[2rem] overflow-hidden border border-surface-variant/20 flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
    >
      {/* ── Photo / Fallback ── */}
      <div
        className="relative h-44 overflow-hidden flex-shrink-0 flex items-center justify-center"
        style={{
          backgroundColor:
            place.image && !imgError ? undefined : colors.photoBg,
        }}
      >
        {place.image && !imgError ? (
          <img
            src={place.image}
            alt={place.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span
            className="material-symbols-outlined text-6xl"
            style={{ color: colors.badgeText, opacity: 0.45 }}
          >
            {CATEGORY_ICONS[place.category]}
          </span>
        )}

        {place.image && !imgError && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        )}

        {/* Badge catégorie */}
        <span
          className="absolute top-3 left-3 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"
          style={{ backgroundColor: colors.badgeBg, color: colors.badgeText }}
        >
          <span className="material-symbols-outlined text-[13px]">
            {CATEGORY_ICONS[place.category]}
          </span>
          {CATEGORY_LABELS[place.category]}
        </span>

        {/* Badge Ouvert / Fermé */}
        {place.isOpen != null && (
          <span
            className={`absolute top-3 right-3 text-xs font-bold px-3 py-1.5 rounded-full ${
              place.isOpen
                ? "bg-[#EAF3DE] text-[#27500A]"
                : "bg-[#FCEBEB] text-[#791F1F]"
            }`}
          >
            {place.isOpen ? "Ouvert" : "Fermé"}
          </span>
        )}

        {/* Distance */}
        {place.distance != null && (
          <span className="absolute bottom-3 left-3 text-white text-[11px] font-bold bg-black/50 px-2.5 py-1 rounded-full flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">near_me</span>
            {formatDistance(place.distance)}
          </span>
        )}

        {/* Quick actions on hover */}
        <div
          className="absolute bottom-0 left-0 right-0 flex transition-all duration-200"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(6px)",
          }}
        >
          {place.phone && (
            <a
              href={`tel:${place.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: colors.actionLight,
                color: colors.badgeBg,
              }}
            >
              <span className="material-symbols-outlined text-sm">call</span>
              Appeler
            </a>
          )}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold hover:opacity-90 transition-opacity"
              style={{
                backgroundColor: colors.actionDark,
                color: colors.badgeBg,
              }}
            >
              <span className="material-symbols-outlined text-sm">near_me</span>
              Itinéraire
            </a>
          )}
          {!place.phone && !mapsUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(place);
              }}
              className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold"
              style={{
                backgroundColor: colors.actionLight,
                color: colors.badgeBg,
              }}
            >
              <span className="material-symbols-outlined text-sm">
                open_in_new
              </span>
              Voir détails
            </button>
          )}
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="p-5 flex flex-col flex-1 gap-2">
        <div>
          <h3
            className="font-headline text-base font-bold leading-snug break-words"
            style={{ color: colors.actionLight }}
          >
            {place.name}
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5 flex items-start gap-1 line-clamp-2">
            <span className="material-symbols-outlined text-xs mt-px flex-shrink-0">
              location_on
            </span>
            <span>
              {[place.address, place.city].filter(Boolean).join(", ") ||
                "Adresse non renseignée"}
            </span>
          </p>
        </div>

        {place.rating != null && (
          <StarRating
            rating={place.rating}
            reviewCount={place.reviewCount}
            color={colors.actionLight}
          />
        )}

        {place.phone && (
          <p className="text-xs text-on-surface-variant flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">call</span>
            {place.phone}
          </p>
        )}

        {place.tags && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1">
            {place.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: colors.tagBg, color: colors.tagText }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
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
  const [imgError, setImgError] = useState(false);
  const colors = CATEGORY_COLORS[place.category];
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
      <div className="relative z-10 bg-surface-container-lowest w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-surface-variant/20">
        <div className="flex justify-center pt-4 pb-1 sm:hidden">
          <div className="w-10 h-1.5 rounded-full bg-outline-variant" />
        </div>

        <div
          className="relative h-56 overflow-hidden mx-4 mt-3 rounded-2xl flex items-center justify-center"
          style={{
            backgroundColor:
              place.image && !imgError ? undefined : colors.photoBg,
          }}
        >
          {place.image && !imgError ? (
            <img
              src={place.image}
              alt={place.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span
              className="material-symbols-outlined text-7xl"
              style={{ color: colors.badgeText, opacity: 0.4 }}
            >
              {CATEGORY_ICONS[place.category]}
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-2xl" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/75 mb-1">
              <span className="material-symbols-outlined text-sm">
                {CATEGORY_ICONS[place.category]}
              </span>
              {CATEGORY_LABELS[place.category]}
            </span>
            <h2 className="font-headline text-xl font-bold text-white leading-snug break-words">
              {place.name}
            </h2>
          </div>
        </div>

        <div className="p-6 pt-4">
          <div className="flex justify-end mb-3">
            <button
              onClick={onClose}
              className="w-9 h-9 bg-surface-container-high rounded-full flex items-center justify-center hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {place.rating != null && (
            <div className="mb-4 flex justify-center">
              <StarRating
                rating={place.rating}
                reviewCount={place.reviewCount}
                color={colors.actionLight}
              />
            </div>
          )}

          {place.isOpen != null && (
            <div
              className={`mb-4 text-center py-2 rounded-xl text-sm font-bold ${place.isOpen ? "bg-[#EAF3DE] text-[#27500A]" : "bg-[#FCEBEB] text-[#791F1F]"}`}
            >
              {place.isOpen ? "✓ Ouvert maintenant" : "✗ Fermé"}
            </div>
          )}

          {place.distance != null && (
            <div className="bg-surface-container-low rounded-2xl p-4 text-center border border-surface-variant/20 mb-4">
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

          <div className="flex items-start gap-3 p-4 bg-surface-container-low rounded-2xl border border-surface-variant/20 mb-3">
            <span className="material-symbols-outlined text-primary flex-shrink-0 mt-0.5">
              location_on
            </span>
            <p className="text-sm text-on-surface-variant break-words">
              {[place.address, place.city].filter(Boolean).join(", ") ||
                "Adresse non renseignée"}
            </p>
          </div>

          {place.phone && (
            <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-2xl border border-surface-variant/20 mb-3">
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

          {place.website && (
            <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-2xl border border-surface-variant/20 mb-3">
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

          {place.tags && place.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {place.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: colors.tagBg,
                    color: colors.tagText,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            {place.phone && (
              <a
                href={`tel:${place.phone}`}
                className="flex-1 py-4 rounded-xl border font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                style={{
                  borderColor: colors.actionLight,
                  color: colors.actionLight,
                }}
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
                className="flex-1 py-4 rounded-xl text-white font-bold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: colors.actionLight }}
              >
                <span className="material-symbols-outlined text-base">
                  near_me
                </span>
                Directions
              </a>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 py-4 rounded-xl text-white font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: colors.actionLight }}
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
    <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden border border-surface-variant/20 flex flex-col animate-pulse">
      <div className="h-44 bg-surface-container-high" />
      <div className="p-5 flex flex-col gap-3">
        <div className="h-4 w-3/4 bg-surface-container-high rounded-full" />
        <div className="h-3 w-full bg-surface-container-high rounded-full" />
        <div className="h-3 w-2/3 bg-surface-container-high rounded-full" />
        <div className="flex gap-2 mt-1">
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
        <span className="material-symbols-outlined">refresh</span>Reset
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
  return [...places].sort((a, b) =>
    by === "name"
      ? a.name.localeCompare(b.name)
      : (a.distance ?? Infinity) - (b.distance ?? Infinity),
  );
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

  // ─── AI Features State ──────────────────────────────────────────────────────
  const [aiQuery, setAiQuery] = useState<string>("");
  const [aiEntity, setAiEntity] = useState<EntityType>("activity");
  const [usePersonalised, setUsePersonalised] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // ─── AI Hooks ───────────────────────────────────────────────────────────────
  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
  } = useSearch(aiQuery, {
    entity: aiEntity,
    personalised: usePersonalised && isLoggedIn,
    top_k: 6,
    debounceMs: 400,
  });

  const {
    results: recommendations,
    loading: recLoading,
    error: recError,
  } = useRecommendations(aiEntity, 6);

  const {
    matches,
    loading: matchLoading,
    error: matchError,
  } = useMatchLocals(3);

  // Check if user is logged in (from localStorage)
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const doSearch = useCallback(async (f: ExploreFilters) => {
    if (!f.location.trim() || !f.categories.length) return;
    const resolved = { ...f };
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
      {/* ── Hero Banner ── */}
      <HeroBanner />
      <div className="pt-8 pb-32 min-h-screen px-4 md:px-8 max-w-[1000px] mx-auto">
        {/* ── Search Panel ── */}
        <div className="bg-surface-container-lowest rounded-[2rem] border border-surface-variant/20 shadow-lg shadow-primary/5 p-6 sm:p-8 space-y-7">
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

          <RadiusSlider
            value={filters.radiusMeters}
            onChange={(v) => setFilters((f) => ({ ...f, radiusMeters: v }))}
          />

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

        {/* ── Results ── */}
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

      {/* ── AI Section: Search, Recommendations & Social Matching ── */}
      <div className="pt-8 pb-32 min-h-screen px-4 md:px-8 max-w-7xl mx-auto">
        {/* ── AI Search Panel ── */}
        <section className="mb-20">
          <div className="mb-8">
            <h2 className="font-headline text-4xl font-bold text-primary mb-2">
              Discover with AI
            </h2>
            <p className="text-on-surface-variant text-lg">
              Explore personalized activities, places, and connect with local
              guides
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-[2rem] border border-surface-variant/20 shadow-lg shadow-primary/5 p-6 sm:p-8 space-y-6">
            {/* Search Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Search for experiences & places
              </label>
              <input
                type="search"
                className="w-full px-6 py-4 rounded-2xl border border-surface-variant/40 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Try: outdoor adventure, traditional craft workshop, local café…"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
              />
            </div>

            {/* Entity Type Select & Personalization Toggle */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Search Type
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-surface-variant/40 bg-surface-container-low text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  value={aiEntity}
                  onChange={(e) => setAiEntity(e.target.value as EntityType)}
                >
                  <option value="activity">Activities</option>
                  <option value="place">Places</option>
                </select>
              </div>

              {isLoggedIn && (
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Preferences
                  </label>
                  <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-surface-variant/40 bg-surface-container-low cursor-pointer hover:border-primary/50 transition-all">
                    <input
                      type="checkbox"
                      checked={usePersonalised}
                      onChange={(e) => setUsePersonalised(e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer"
                    />
                    <span className="text-sm font-medium">
                      Use my profile (personalized results)
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Search Results */}
          {aiQuery.trim().length >= 2 && (
            <div className="mt-8">
              {searchLoading && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-on-surface-variant font-medium">
                    Searching…
                  </p>
                </div>
              )}

              {searchError && (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-error/40 block mb-4">
                    error
                  </span>
                  <p className="text-error font-medium">{searchError}</p>
                </div>
              )}

              {!searchLoading && searchResults.length === 0 && (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined text-6xl text-on-surface-variant/40 block mb-4">
                    search_off
                  </span>
                  <p className="text-on-surface-variant font-medium">
                    No results found. Try a different search.
                  </p>
                </div>
              )}

              {searchResults.length > 0 && (
                <div>
                  <h3 className="font-headline text-xl font-bold text-on-surface mb-6">
                    Search Results ({searchResults.length})
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {searchResults.map((item) => (
                      <ActivityCard
                        key={item.id}
                        activity={{
                          id: item.id as number,
                          title: (item.data as any)?.title || "Activity",
                          description:
                            (item.data as any)?.description || "No description",
                          price: (item.data as any)?.price || 0,
                          date:
                            (item.data as any)?.date ||
                            new Date().toISOString(),
                          location: (item.data as any)?.location || "Tunisia",
                          latitude: (item.data as any)?.latitude || 35.8,
                          longitude: (item.data as any)?.longitude || 10.1957,
                          images: (item.data as any)?.images || [],
                          capacity: (item.data as any)?.capacity || 1,
                          category: (item.data as any)?.category || "OTHER",
                          status: "APPROVED",
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                          creatorId: 0,
                          creator: {
                            id: 0,
                            fullName: "Creator",
                            image: "",
                          },
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Recommendations Section (Logged-in only, when not searching) ── */}
        {isLoggedIn && aiQuery.trim().length < 2 && (
          <section className="mb-20">
            <div className="mb-8">
              <h2 className="font-headline text-3xl font-bold text-on-surface">
                Recommendations for You
              </h2>
              <p className="text-on-surface-variant text-sm mt-1">
                Based on your interests and profile
              </p>
            </div>

            {recLoading && (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-on-surface-variant font-medium">
                  Loading recommendations…
                </p>
              </div>
            )}

            {recError && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-error/40 block mb-4">
                  error
                </span>
                <p className="text-error font-medium">{recError}</p>
              </div>
            )}

            {!recLoading && recommendations.length === 0 && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant/40 block mb-4">
                  lightbulb
                </span>
                <p className="text-on-surface-variant font-medium">
                  Update your interests to get personalized recommendations
                </p>
              </div>
            )}

            {recommendations.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {recommendations.map((item) => (
                  <ActivityCard
                    key={item.id}
                    activity={{
                      id: item.id as number,
                      title: (item.data as any)?.title || "Activity",
                      description:
                        (item.data as any)?.description || "No description",
                      price: (item.data as any)?.price || 0,
                      date:
                        (item.data as any)?.date || new Date().toISOString(),
                      location: (item.data as any)?.location || "Tunisia",
                      latitude: (item.data as any)?.latitude || 35.8,
                      longitude: (item.data as any)?.longitude || 10.1957,
                      images: (item.data as any)?.images || [],
                      capacity: (item.data as any)?.capacity || 1,
                      category: (item.data as any)?.category || "OTHER",
                      status: "APPROVED",
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      creatorId: 0,
                      creator: {
                        id: 0,
                        fullName: "Creator",
                        image: "",
                      },
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Social Matching Section (Tourists only) ── */}
        {isLoggedIn && aiQuery.trim().length < 2 && (
          <section className="mb-20">
            <div className="mb-8">
              <h2 className="font-headline text-3xl font-bold text-on-surface">
                Meet Local Guides
              </h2>
              <p className="text-on-surface-variant text-sm mt-1">
                Connect with locals who share your interests
              </p>
            </div>

            {matchLoading && (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-on-surface-variant font-medium">
                  Finding matches…
                </p>
              </div>
            )}

            {matchError && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-error/40 block mb-4">
                  error
                </span>
                <p className="text-error font-medium">{matchError}</p>
              </div>
            )}

            {!matchLoading && matches.length === 0 && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant/40 block mb-4">
                  people
                </span>
                <p className="text-on-surface-variant font-medium">
                  No local guides found. Check back soon!
                </p>
              </div>
            )}

            {matches.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.map((match) => (
                  <MatchedLocalCard
                    key={match.id}
                    match={match as any}
                    localId={
                      typeof match.id === "number"
                        ? match.id
                        : parseInt(String(match.id), 10)
                    }
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </>
  );
}
