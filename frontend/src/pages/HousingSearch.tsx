import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { LocationAutocomplete } from "./LocationAutocomplete";
import { createDM } from "../types/messages";
import housingImg from "../assets/housingSearch.jpg";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocalUser {
  id: number;
  fullName: string;
  image?: string | null;
}

export type HousingType =
  | "APARTMENT"
  | "VILLA"
  | "STUDIO"
  | "TRADITIONAL_HOUSE"
  | "FARM_STAY"
  | "GUESTHOUSE"
  | "RIAD"
  | "CHALET";

export const HOUSING_TYPE_LABELS: Record<HousingType, string> = {
  APARTMENT: "Apartment",
  VILLA: "Villa",
  STUDIO: "Studio",
  TRADITIONAL_HOUSE: "Traditional House",
  FARM_STAY: "Farm Stay",
  GUESTHOUSE: "Guesthouse",
  RIAD: "Riad",
  CHALET: "Chalet",
};

export const HOUSING_TYPE_ICONS: Record<HousingType, string> = {
  APARTMENT: "apartment",
  VILLA: "villa",
  STUDIO: "living",
  TRADITIONAL_HOUSE: "cottage",
  FARM_STAY: "agriculture",
  GUESTHOUSE: "night_shelter",
  RIAD: "fort",
  CHALET: "cabin",
};

export interface Housing {
  id: string;
  title: string;
  description: string;
  location: string;
  type: HousingType;
  floors: number;
  rooms: number;
  familyMembers: number;
  maxTourists: number;
  maxStayDays: number;
  images: string[];
  createdAt: string;
  updatedAt?: string;
  ownerId: number;
}

export interface HousingFilters {
  search?: string;
  location?: string;
  types?: HousingType[];
  minRooms?: number;
  maxRooms?: number;
  minTourists?: number;
  maxTourists?: number;
  minStayDays?: number;
  maxStayDays?: number;
  sortBy?: "newest" | "oldest" | "maxTourists" | "maxStayDays" | "rooms";
}

// ─── Toast types ──────────────────────────────────────────────────────────────

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  subtitle?: string;
}

// ─── Axios instance ───────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatDuration(days: number): string {
  if (days === 1) return "1 Day";
  if (days < 7) return `${days} Days`;
  if (days === 7) return "1 Week";
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    const rem = days % 7;
    return rem === 0 ? `${weeks}w` : `${weeks}w ${rem}d`;
  }
  if (days === 30) return "1 Month";
  if (days < 365) {
    const months = Math.floor(days / 30);
    const rem = days % 30;
    return rem === 0 ? `${months}mo` : `${months}mo ${rem}d`;
  }
  return "1 Year";
}

// ─── API ──────────────────────────────────────────────────────────────────────

const housingSearchApi = {
  async search(filters: HousingFilters, userId?: number): Promise<Housing[]> {
    const params: Record<string, string> = {};
    if (filters.search) params.search = filters.search;
    if (filters.location) params.location = filters.location;
    if (filters.types?.length) params.types = filters.types.join(",");
    if (filters.minRooms != null) params.minRooms = String(filters.minRooms);
    if (filters.maxRooms != null) params.maxRooms = String(filters.maxRooms);
    if (filters.minTourists != null)
      params.minTourists = String(filters.minTourists);
    if (filters.maxTourists != null)
      params.maxTourists = String(filters.maxTourists);
    if (filters.minStayDays != null)
      params.minStayDays = String(filters.minStayDays);
    if (filters.maxStayDays != null)
      params.maxStayDays = String(filters.maxStayDays);
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (userId) params.excludeReservedBy = String(userId);

    const { data } = await api.get<Housing[]>(
      "http://localhost:5000/api/housingSearch/search",
      { params },
    );
    return data;
  },
};

const reservationApi = {
  async create(
    housingId: string,
  ): Promise<{ reservation: any; message: string }> {
    const { data } = await api.post("http://localhost:5000/api/reservations", {
      housingId,
    });
    return data;
  },
};

// ─── Toast Container ──────────────────────────────────────────────────────────

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  const variantConfig: Record<
    ToastVariant,
    { bg: string; icon: string; iconColor: string; border: string }
  > = {
    success: {
      bg: "bg-[#1a2e1a]",
      border: "border-emerald-500/30",
      icon: "check_circle",
      iconColor: "text-emerald-400",
    },
    error: {
      bg: "bg-[#2e1a1a]",
      border: "border-red-500/30",
      icon: "error",
      iconColor: "text-red-400",
    },
    info: {
      bg: "bg-[#1a1e2e]",
      border: "border-blue-500/30",
      icon: "info",
      iconColor: "text-blue-400",
    },
    warning: {
      bg: "bg-[#2e271a]",
      border: "border-amber-500/30",
      icon: "warning",
      iconColor: "text-amber-400",
    },
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const cfg = variantConfig[toast.variant];
        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl
              ${cfg.bg} border ${cfg.border}
              shadow-2xl shadow-black/40
              backdrop-blur-xl
              animate-[slideInRight_0.35s_cubic-bezier(0.34,1.56,0.64,1)]
            `}
            style={{
              animation: "slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <span
              className={`material-symbols-outlined text-xl flex-shrink-0 mt-0.5 ${cfg.iconColor}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {cfg.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-snug">
                {toast.message}
              </p>
              {toast.subtitle && (
                <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                  {toast.subtitle}
                </p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors mt-0.5"
            >
              <span className="material-symbols-outlined text-white/50 text-sm">
                close
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── useToast hook ────────────────────────────────────────────────────────────

function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "success", subtitle?: string) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, variant, subtitle }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  return { toasts, toast, dismiss };
}

// ─── Components ───────────────────────────────────────────────────────────────

function RangeSlider({
  label,
  min,
  max,
  value,
  onChange,
  formatValue,
}: {
  label: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  formatValue?: (v: number) => string;
}) {
  const fmt = formatValue ?? String;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          {label}
        </span>
        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {fmt(value[0])} – {fmt(value[1])}
        </span>
      </div>
      <div className="relative h-1.5 bg-surface-container-high rounded-full">
        <div
          className="absolute h-full bg-primary rounded-full"
          style={{
            left: `${((value[0] - min) / (max - min)) * 100}%`,
            right: `${100 - ((value[1] - min) / (max - min)) * 100}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value[0]}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v <= value[1]) onChange([v, value[1]]);
          }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ zIndex: 2 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value[1]}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v >= value[0]) onChange([value[0], v]);
          }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ zIndex: 3 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md pointer-events-none"
          style={{
            left: `calc(${((value[0] - min) / (max - min)) * 100}% - 8px)`,
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md pointer-events-none"
          style={{
            left: `calc(${((value[1] - min) / (max - min)) * 100}% - 8px)`,
          }}
        />
      </div>
    </div>
  );
}

function TypeChip({
  type,
  selected,
  onClick,
}: {
  type: HousingType;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
        selected
          ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-[1.03]"
          : "bg-surface-container-low border-surface-variant/40 text-on-surface-variant hover:border-primary/50 hover:text-primary"
      }`}
    >
      <span className="material-symbols-outlined text-sm">
        {HOUSING_TYPE_ICONS[type]}
      </span>
      {HOUSING_TYPE_LABELS[type]}
    </button>
  );
}

// ─── Sidebar Filter ────────────────────────────────────────────────────────────

function FilterSidebar({
  filters,
  onChange,
  onReset,
  activeCount,
}: {
  filters: HousingFilters;
  onChange: (f: HousingFilters) => void;
  onReset: () => void;
  activeCount: number;
}) {
  const ALL_TYPES: HousingType[] = [
    "APARTMENT",
    "VILLA",
    "STUDIO",
    "TRADITIONAL_HOUSE",
    "FARM_STAY",
    "GUESTHOUSE",
    "RIAD",
    "CHALET",
  ];

  const toggleType = (t: HousingType) => {
    const current = filters.types ?? [];
    const next = current.includes(t)
      ? current.filter((x) => x !== t)
      : [...current, t];
    onChange({ ...filters, types: next.length ? next : undefined });
  };

  return (
    <aside className="w-72 shrink-0 self-start sticky top-28">
      <div className="bg-surface-container-lowest rounded-[1.75rem] border border-surface-variant/20 shadow-lg shadow-primary/5 overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">
              tune
            </span>
            <h2 className="font-headline text-base font-bold text-primary">
              Filters
            </h2>
            {activeCount > 0 && (
              <span className="bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </div>
          {activeCount > 0 && (
            <button
              onClick={onReset}
              className="text-[10px] font-bold uppercase tracking-widest text-error hover:text-error/70 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        <div className="p-6 space-y-7">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Location
            </label>
            <LocationAutocomplete
              value={filters.location ?? ""}
              onChange={(val) =>
                onChange({ ...filters, location: val || undefined })
              }
              placeholder="City or region…"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Housing Type
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_TYPES.map((t) => (
                <TypeChip
                  key={t}
                  type={t}
                  selected={(filters.types ?? []).includes(t)}
                  onClick={() => toggleType(t)}
                />
              ))}
            </div>
          </div>

          <RangeSlider
            label="Rooms"
            min={1}
            max={20}
            value={[filters.minRooms ?? 1, filters.maxRooms ?? 20]}
            onChange={([a, b]) =>
              onChange({
                ...filters,
                minRooms: a === 1 ? undefined : a,
                maxRooms: b === 20 ? undefined : b,
              })
            }
          />

          <RangeSlider
            label="Guests"
            min={1}
            max={20}
            value={[filters.minTourists ?? 1, filters.maxTourists ?? 20]}
            onChange={([a, b]) =>
              onChange({
                ...filters,
                minTourists: a === 1 ? undefined : a,
                maxTourists: b === 20 ? undefined : b,
              })
            }
          />

          <RangeSlider
            label="Stay Duration"
            min={1}
            max={365}
            value={[filters.minStayDays ?? 1, filters.maxStayDays ?? 365]}
            onChange={([a, b]) =>
              onChange({
                ...filters,
                minStayDays: a === 1 ? undefined : a,
                maxStayDays: b === 365 ? undefined : b,
              })
            }
            formatValue={formatDuration}
          />

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Sort By
            </label>
            <select
              value={filters.sortBy ?? "newest"}
              onChange={(e) =>
                onChange({
                  ...filters,
                  sortBy: e.target.value as HousingFilters["sortBy"],
                })
              }
              className="w-full bg-surface-container-low border border-surface-variant/40 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="maxTourists">Most Guests</option>
              <option value="maxStayDays">Longest Stay</option>
              <option value="rooms">Most Rooms</option>
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
}

// ─── Housing Card ──────────────────────────────────────────────────────────────

function HousingCard({
  housing,
  onSelect,
}: {
  housing: Housing;
  onSelect: (h: Housing) => void;
}) {
  const BASE_URL = "http://localhost:5000";
  const resolveImage = (src: string) =>
    src.startsWith("http") || src.startsWith("data:")
      ? src
      : `${BASE_URL}${src}`;

  return (
    <article
      onClick={() => onSelect(housing)}
      className="group bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-lg shadow-primary/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-surface-variant/20 flex flex-col cursor-pointer hover:-translate-y-1"
    >
      <div className="relative h-52 overflow-hidden">
        {housing.images[0] ? (
          <img
            src={resolveImage(housing.images[0])}
            alt={housing.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-outline-variant">
              {HOUSING_TYPE_ICONS[housing.type]}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow">
          {HOUSING_TYPE_LABELS[housing.type]}
        </span>
        <span className="absolute top-4 right-4 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
          {housing.maxTourists} guests
        </span>
        {/* Available badge */}
        <span className="absolute bottom-4 right-4 bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />
          Available
        </span>
        <div className="absolute bottom-4 left-4 right-16">
          <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">
              location_on
            </span>
            {housing.location}
          </p>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-headline text-lg font-bold text-primary leading-snug group-hover:text-tertiary transition-colors line-clamp-1">
            {housing.title}
          </h3>
          <p className="text-sm text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">
            {housing.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant mt-auto">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-primary">
              bed
            </span>
            {housing.rooms} rooms
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-primary">
              layers
            </span>
            {housing.floors} floor{housing.floors > 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-primary">
              people
            </span>
            {housing.familyMembers} host{housing.familyMembers > 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-primary">
              calendar_month
            </span>
            Up to {formatDuration(housing.maxStayDays)}
          </span>
        </div>

        <button className="mt-2 w-full py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all duration-200 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm">open_in_new</span>
          View Details
        </button>
      </div>
    </article>
  );
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────

function HousingDetailModal({
  housing,
  onClose,
  currentUser,
  onRequestSuccess,
}: {
  housing: Housing;
  onClose: () => void;
  currentUser: LocalUser | null;
  onRequestSuccess: (housingTitle: string) => void;
}) {
  const navigate = useNavigate();
  const BASE_URL = "http://localhost:5000";
  const resolveImage = (src: string) =>
    src.startsWith("http") ? src : `${BASE_URL}${src}`;
  const [activeImg, setActiveImg] = useState(0);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const handleRequestStay = async () => {
    if (!currentUser) return;

    if (currentUser.id === housing.ownerId) {
      setRequestError("You cannot request a stay at your own listing.");
      return;
    }

    setRequesting(true);
    setRequestError(null);

    try {
      // 1. Create reservation in DB (PENDING status)
      await reservationApi.create(housing.id);

      // 2. Open DM conversation with the owner
      const conv = await createDM(housing.ownerId);

      // 3. Navigate to messaging with auto-message
      navigate("/messaging", {
        state: {
          targetConvId: conv.id,
          autoMessage:
            `Hello! I'm interested in your accommodation « ${housing.title} » in ${housing.location} (${HOUSING_TYPE_LABELS[housing.type]}, ${housing.rooms} bedroom${housing.rooms > 1 ? "s" : ""}, up to ${housing.maxTourists} traveler${housing.maxTourists > 1 ? "s" : ""}). Would it be possible to arrange a stay? Thank you`!,
        },
      });

      // 4. Notify parent to show success toast + remove from list
      onRequestSuccess(housing.title);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        "Unable to complete your request. Please try again.";
      setRequestError(msg);
    } finally {
      setRequesting(false);
    }
  };

  const isOwnListing = currentUser?.id === housing.ownerId;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 bg-surface-container-lowest w-full sm:max-w-2xl max-h-[92dvh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl shadow-primary/20 border border-surface-variant/20">
        <div className="flex justify-center pt-4 pb-1 sm:hidden">
          <div className="w-10 h-1.5 rounded-full bg-outline-variant" />
        </div>

        {housing.images.length > 0 && (
          <div className="relative h-72 overflow-hidden sm:rounded-t-[2.5rem]">
            <img
              src={resolveImage(housing.images[activeImg])}
              alt={housing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            {housing.images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImg((i) => Math.max(0, i - 1))}
                  disabled={activeImg === 0}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/60 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">
                    chevron_left
                  </span>
                </button>
                <button
                  onClick={() =>
                    setActiveImg((i) =>
                      Math.min(housing.images.length - 1, i + 1),
                    )
                  }
                  disabled={activeImg === housing.images.length - 1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/60 transition-all"
                >
                  <span className="material-symbols-outlined text-lg">
                    chevron_right
                  </span>
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {housing.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`rounded-full transition-all ${i === activeImg ? "w-4 h-2 bg-white" : "w-2 h-2 bg-white/50"}`}
                    />
                  ))}
                </div>
              </>
            )}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        )}

        <div className="p-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-tertiary flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">
                  location_on
                </span>
                {housing.location}
              </span>
              <h2 className="font-headline text-2xl font-bold text-primary mt-1">
                {housing.title}
              </h2>
            </div>
            <span className="shrink-0 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">
                {HOUSING_TYPE_ICONS[housing.type]}
              </span>
              {HOUSING_TYPE_LABELS[housing.type]}
            </span>
          </div>

          <p className="text-sm text-on-surface-variant leading-relaxed mt-4 mb-6">
            {housing.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { icon: "bed", label: "Rooms", value: housing.rooms },
              { icon: "layers", label: "Floors", value: housing.floors },
              {
                icon: "people",
                label: "Max Guests",
                value: housing.maxTourists,
              },
              {
                icon: "calendar_month",
                label: "Max Stay",
                value: formatDuration(housing.maxStayDays),
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-surface-container-low rounded-2xl p-4 text-center border border-surface-variant/20"
              >
                <span className="material-symbols-outlined text-primary text-xl mb-1 block">
                  {s.icon}
                </span>
                <p className="font-headline text-xl font-black text-primary">
                  {s.value}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-2xl border border-surface-variant/20 mb-6">
            <span className="material-symbols-outlined text-tertiary">
              family_restroom
            </span>
            <p className="text-sm text-on-surface-variant">
              Hosted by a family of{" "}
              <span className="font-bold text-on-surface">
                {housing.familyMembers}
              </span>{" "}
              — authentic local experience
            </p>
          </div>

          {/* What happens when you request */}
          {!isOwnListing && (
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/20 mb-6">
              <span className="material-symbols-outlined text-primary text-base mt-0.5">
                info
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Clicking{" "}
                <span className="font-bold text-primary">Request a Stay</span>{" "}
                will send a message to the host and create a reservation
                request.
              </p>
            </div>
          )}

          {requestError && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-xl text-sm text-error">
              <span className="material-symbols-outlined text-base">error</span>
              {requestError}
            </div>
          )}

          {isOwnListing ? (
            <div className="w-full py-4 rounded-xl bg-surface-container-high text-on-surface-variant font-bold text-sm flex items-center justify-center gap-2 text-center">
              <span className="material-symbols-outlined text-base">home</span>
              This is your listing
            </div>
          ) : (
            <button
              onClick={handleRequestStay}
              disabled={requesting}
              className="w-full py-4 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {requesting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Sending request…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">
                    mail
                  </span>
                  Request a Stay
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-lg border border-surface-variant/20 flex flex-col animate-pulse">
      <div className="h-52 bg-surface-container-high" />
      <div className="p-5 flex flex-col gap-3">
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-surface-container-high rounded-full" />
          <div className="h-3 w-full bg-surface-container-high rounded-full" />
          <div className="h-3 w-2/3 bg-surface-container-high rounded-full" />
        </div>
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-4 w-16 bg-surface-container-high rounded-full"
            />
          ))}
        </div>
        <div className="h-9 bg-surface-container-high rounded-xl mt-1" />
      </div>
    </div>
  );
}

// ─── Mobile Filter Drawer ─────────────────────────────────────────────────────

function MobileFilterDrawer({
  open,
  onClose,
  filters,
  onChange,
  onReset,
  activeCount,
}: {
  open: boolean;
  onClose: () => void;
  filters: HousingFilters;
  onChange: (f: HousingFilters) => void;
  onReset: () => void;
  activeCount: number;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 bg-surface-container-lowest w-full max-h-[85dvh] overflow-y-auto rounded-t-[2.5rem] shadow-2xl">
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-10 h-1.5 rounded-full bg-outline-variant" />
        </div>
        <div className="px-6 pb-8">
          <div className="flex items-center justify-between py-4 border-b border-surface-variant/20 mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                tune
              </span>
              <h2 className="font-headline text-lg font-bold text-primary">
                Filters
              </h2>
              {activeCount > 0 && (
                <span className="bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {activeCount > 0 && (
                <button
                  onClick={onReset}
                  className="text-xs font-bold text-error"
                >
                  Reset
                </button>
              )}
              <button
                onClick={onClose}
                className="w-9 h-9 bg-surface-container-high rounded-full flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">
                  close
                </span>
              </button>
            </div>
          </div>
          <FilterSidebar
            filters={filters}
            onChange={onChange}
            onReset={onReset}
            activeCount={activeCount}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS: HousingFilters = { sortBy: "newest" };

function countActiveFilters(f: HousingFilters): number {
  let n = 0;
  if (f.location) n++;
  if (f.types?.length) n++;
  if (f.minRooms != null || f.maxRooms != null) n++;
  if (f.minTourists != null || f.maxTourists != null) n++;
  if (f.minStayDays != null || f.maxStayDays != null) n++;
  return n;
}

// ─── Guest Banner ─────────────────────────────────────────────────────────────

function GuestBanner() {
  return (
    <main className="pt-20 min-h-screen w-full bg-surface-container-low">
      <div className="w-full min-h-[calc(100vh-80px)] flex flex-col">
        <div className="flex-1 w-full bg-surface px-6 md:px-20 py-12 flex flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-1.5 bg-amber-50 rounded-full px-4 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">
              Authentic Tunisian Hospitality
            </span>
          </div>
          <div className="text-center max-w-2xl">
            <h1 className="font-headline text-4xl md:text-5xl italic text-primary leading-tight mb-4">
              Stay With Locals,
              <br />
              Experience Tunisia Authentically
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              Discover welcoming Tunisian families opening their homes to
              travellers.
            </p>
          </div>
          <a
            href="/auth"
            className="px-10 py-4 bg-primary text-on-primary rounded-xl text-sm font-bold uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-95 transition-transform"
          >
            Sign in to Explore Homes
          </a>
        </div>
      </div>
    </main>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function HousingSearchPage() {
  const [currentUser, setCurrentUser] = useState<LocalUser | null | undefined>(
    undefined,
  );

  const [housings, setHousings] = useState<Housing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HousingFilters>(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Housing | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { toasts, toast, dismiss } = useToast();

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      setCurrentUser(raw ? (JSON.parse(raw) as LocalUser) : null);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const fetchHousings = useCallback(
    async (f: HousingFilters, userId?: number) => {
      setLoading(true);
      setError(null);
      try {
        const data = await housingSearchApi.search(f, userId);
        setHousings(data);
      } catch {
        setError("Failed to load housings. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (currentUser === undefined) return;
    if (!currentUser) return;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchHousings(
        { ...filters, search: search || undefined },
        currentUser.id,
      );
    }, 350);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [filters, search, currentUser]);

  // Called after a successful reservation request
  const handleRequestSuccess = useCallback(
    (housingTitle: string) => {
      // Remove the housing from the local list immediately (optimistic update)
      if (selected) {
        setHousings((prev) => prev.filter((h) => h.id !== selected.id));
      }

      // Show success toast
      toast(
        "Reservation request sent!",
        "success",
        `Your request for "${housingTitle}" has been submitted. The host will review it shortly.`,
      );

      // Secondary toast after a brief delay
      setTimeout(() => {
        toast(
          "Message sent to host",
          "info",
          "Check your messages to continue the conversation.",
        );
      }, 1200);
    },
    [selected, toast],
  );

  const handleFiltersChange = (f: HousingFilters) => setFilters(f);
  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setSearch("");
  };

  const activeCount = countActiveFilters(filters);

  if (currentUser === undefined) return null;
  if (!currentUser) return <GuestBanner />;

  return (
    <>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div className="pt-24 pb-32 min-h-screen px-4 md:px-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-tertiary mb-2">
            Discover Tunisia
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-headline text-4xl sm:text-5xl font-black text-primary leading-tight">
                Find Your{" "}
                <span className="italic font-normal">Perfect Stay</span>
              </h1>
              <p className="text-on-surface-variant mt-2 text-base">
                Authentic homes hosted by Tunisian families — explore, filter,
                and connect.
              </p>
            </div>
            {!loading && (
              <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-xs font-bold text-emerald-700">
                    All Available
                  </span>
                </div>
                <p className="text-sm font-bold text-on-surface-variant bg-surface-container-low px-4 py-2 rounded-xl border border-surface-variant/30">
                  {housings.length} listing{housings.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>

          <div className="relative mt-6 max-w-xl">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline-variant">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description or location…"
              className="w-full bg-surface-container-lowest border border-surface-variant/40 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-base">
                  close
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="flex lg:hidden mb-6">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-lowest border border-surface-variant/40 rounded-xl text-sm font-bold text-on-surface shadow-sm hover:border-primary/50 transition-all"
          >
            <span className="material-symbols-outlined text-primary text-base">
              tune
            </span>
            Filters
            {activeCount > 0 && (
              <span className="bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex gap-8 items-start">
          <div className="hidden lg:block">
            <FilterSidebar
              filters={filters}
              onChange={handleFiltersChange}
              onReset={handleReset}
              activeCount={activeCount}
            />
          </div>

          <div className="flex-1 min-w-0">
            {error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <span className="material-symbols-outlined text-6xl text-error/40">
                  cloud_off
                </span>
                <h2 className="font-headline text-2xl text-primary">
                  Something went wrong
                </h2>
                <p className="text-on-surface-variant text-sm max-w-xs">
                  {error}
                </p>
                <button
                  onClick={() =>
                    fetchHousings(
                      { ...filters, search: search || undefined },
                      currentUser?.id,
                    )
                  }
                  className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:scale-[1.03] transition-all shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-sm">
                    refresh
                  </span>
                  Try Again
                </button>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : housings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28 text-center">
                <span className="material-symbols-outlined text-7xl text-outline-variant mb-6">
                  search_off
                </span>
                <h2 className="font-headline text-3xl text-primary mb-2">
                  No matches found
                </h2>
                <p className="text-on-surface-variant mb-6 max-w-sm">
                  Try adjusting your filters or search terms to discover more
                  homes.
                </p>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:scale-[1.03] transition-all shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined">refresh</span>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {housings.map((h) => (
                  <HousingCard key={h.id} housing={h} onSelect={setSelected} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selected && (
        <HousingDetailModal
          housing={selected}
          onClose={() => setSelected(null)}
          currentUser={currentUser}
          onRequestSuccess={handleRequestSuccess}
        />
      )}

      <MobileFilterDrawer
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleReset}
        activeCount={activeCount}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
