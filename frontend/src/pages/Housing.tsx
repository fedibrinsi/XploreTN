import { useState, useRef, useCallback, useEffect } from "react";
import axios from "axios";
import { LocationAutocomplete } from "./LocationAutocomplete";
import messageImg from "../assets/housing1.jpg";

// ─── Types ────────────────────────────────────────────────────────────────────

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

export interface HousingFormData {
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
  removeImages?: string[];
}

export type HousingFormErrors = Partial<Record<keyof HousingFormData, string>>;

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const HOUSING_TYPES: HousingType[] = [
  "APARTMENT",
  "VILLA",
  "STUDIO",
  "TRADITIONAL_HOUSE",
  "FARM_STAY",
  "GUESTHOUSE",
  "RIAD",
  "CHALET",
];

// ─── Axios instance ───────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Validation ───────────────────────────────────────────────────────────────

function validateHousingForm(data: HousingFormData): HousingFormErrors {
  const errors: HousingFormErrors = {};

  if (!data.title.trim()) {
    errors.title = "Title is required.";
  } else if (data.title.trim().length < 5) {
    errors.title = "Title must be at least 5 characters.";
  } else if (data.title.trim().length > 100) {
    errors.title = "Title must be under 100 characters.";
  }

  if (!data.description.trim()) {
    errors.description = "Description is required.";
  } else if (data.description.trim().length < 20) {
    errors.description = "Description must be at least 20 characters.";
  } else if (data.description.trim().length > 1000) {
    errors.description = "Description must be under 1000 characters.";
  }

  if (!data.location.trim()) {
    errors.location = "Location is required.";
  } else if (data.location.trim().length < 3) {
    errors.location = "Please enter a valid city or address.";
  }

  if (!HOUSING_TYPES.includes(data.type)) {
    errors.type = "Please select a valid housing type.";
  }

  if (!Number.isInteger(data.floors) || data.floors < 1 || data.floors > 10)
    errors.floors = "Floors must be between 1 and 10.";

  if (!Number.isInteger(data.rooms) || data.rooms < 1 || data.rooms > 20)
    errors.rooms = "Rooms must be between 1 and 20.";

  if (
    !Number.isInteger(data.familyMembers) ||
    data.familyMembers < 1 ||
    data.familyMembers > 15
  )
    errors.familyMembers = "Family members must be between 1 and 15.";

  if (
    !Number.isInteger(data.maxTourists) ||
    data.maxTourists < 1 ||
    data.maxTourists > 20
  )
    errors.maxTourists = "Max tourists must be between 1 and 20.";

  if (
    !Number.isInteger(data.maxStayDays) ||
    data.maxStayDays < 1 ||
    data.maxStayDays > 365
  )
    errors.maxStayDays = "Max stay must be between 1 and 365 days.";

  return errors;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatDuration(days: number): string {
  if (days === 1) return "1 Day";
  if (days < 7) return `${days} Days`;
  if (days === 7) return "1 Week";
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    const rem = days % 7;
    return rem === 0 ? `${weeks} Weeks` : `${weeks}w ${rem}d`;
  }
  if (days === 30) return "1 Month";
  if (days < 365) {
    const months = Math.floor(days / 30);
    const rem = days % 30;
    return rem === 0
      ? `${months} Month${months > 1 ? "s" : ""}`
      : `${months}mo ${rem}d`;
  }
  return "1 Year";
}

function formatDate(dateStr: string | Date): string {
  return new Intl.DateTimeFormat("en-TN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

// ─── Build FormData ───────────────────────────────────────────────────────────

async function buildFormData(data: HousingFormData): Promise<FormData> {
  const fd = new FormData();
  fd.append("title", data.title.trim());
  fd.append("description", data.description.trim());
  fd.append("location", data.location.trim());
  fd.append("type", data.type);
  fd.append("floors", String(data.floors));
  fd.append("rooms", String(data.rooms));
  fd.append("familyMembers", String(data.familyMembers));
  fd.append("maxTourists", String(data.maxTourists));
  fd.append("maxStayDays", String(data.maxStayDays));

  for (const img of data.images) {
    if (img.startsWith("data:image/")) {
      const res = await fetch(img);
      const blob = await res.blob();
      const ext = blob.type.split("/")[1] ?? "jpg";
      fd.append("images", blob, `photo_${Date.now()}.${ext}`);
    }
  }

  if (data.removeImages && data.removeImages.length > 0) {
    fd.append("removeImages", JSON.stringify(data.removeImages));
  }

  return fd;
}

// ─── API ──────────────────────────────────────────────────────────────────────

function ok<T>(data: T, status = 200): ApiResponse<T> {
  return { data, error: null, status };
}
function fail<T>(message: string, status = 400): ApiResponse<T> {
  return { data: null, error: message, status };
}

const housingApi = {
  async list(): Promise<ApiResponse<Housing[]>> {
    try {
      const { data, status } = await api.get<Housing[]>(
        "http://localhost:5000/api/housings/view",
      );
      return ok(data, status);
    } catch (err: any) {
      return fail(
        err.response?.data?.message ?? "Failed to load housings.",
        err.response?.status ?? 500,
      );
    }
  },

  async create(data: HousingFormData): Promise<ApiResponse<Housing>> {
    try {
      const fd = await buildFormData(data);
      const { data: res, status } = await api.post<{ housing: Housing }>(
        "http://localhost:5000/api/housings/new",
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return ok(res.housing, status);
    } catch (err: any) {
      return fail(
        err.response?.data?.message ?? "Failed to create housing.",
        err.response?.status ?? 500,
      );
    }
  },

  async update(
    id: string,
    data: HousingFormData,
  ): Promise<ApiResponse<Housing>> {
    try {
      const fd = await buildFormData(data);
      const { data: res, status } = await api.put<{ housing: Housing }>(
        `http://localhost:5000/api/housings/${id}`,
        fd,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return ok(res.housing, status);
    } catch (err: any) {
      return fail(
        err.response?.data?.message ?? "Failed to update housing.",
        err.response?.status ?? 500,
      );
    }
  },

  async remove(id: string): Promise<ApiResponse<{ id: string }>> {
    try {
      const { data, status } = await api.delete<{ id: string }>(
        `http://localhost:5000/api/housings/${id}`,
      );
      return ok(data, status);
    } catch (err: any) {
      return fail(
        err.response?.data?.message ?? "Failed to delete housing.",
        err.response?.status ?? 500,
      );
    }
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ label, icon }: { label: string; icon: string }) {
  return (
    <span className="inline-flex items-center gap-1 bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
      <span className="material-symbols-outlined text-xs">{icon}</span>
      {label}
    </span>
  );
}

// ─── Skeleton Card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-lg border border-surface-variant/20 flex flex-col animate-pulse">
      <div className="h-52 bg-surface-container-high" />
      <div className="p-6 flex flex-col gap-4">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-surface-container-high rounded-full" />
          <div className="h-5 w-3/4 bg-surface-container-high rounded-full" />
          <div className="h-3 w-full bg-surface-container-high rounded-full" />
          <div className="h-3 w-2/3 bg-surface-container-high rounded-full" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-7 w-20 bg-surface-container-high rounded-full"
            />
          ))}
        </div>
        <div className="h-10 bg-surface-container-high rounded-xl mt-auto" />
      </div>
    </div>
  );
}

// ─── Housing Card ──────────────────────────────────────────────────────────────
function HousingCard({
  housing,
  onEdit,
  onDelete,
  isDeleting,
}: {
  housing: Housing;
  onEdit: (h: Housing) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const BASE_URL = "http://localhost:5000";

  const resolveImage = (src: string) =>
    src.startsWith("http") || src.startsWith("data:")
      ? src
      : `${BACKEND_URL}${src}`;

  return (
    <article
      className={`group bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-lg shadow-primary/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-surface-variant/20 flex flex-col ${
        isDeleting ? "opacity-50 pointer-events-none scale-95" : ""
      }`}
    >
      {/* Image */}
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
              home
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow">
          {HOUSING_TYPE_LABELS[housing.type]}
        </span>
        <span className="absolute top-4 right-4 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
          {housing.maxTourists} guests max
        </span>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col flex-1 gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-tertiary flex items-center gap-1 mb-1">
            <span className="material-symbols-outlined text-xs">
              location_on
            </span>
            {housing.location}
          </p>
          <h3 className="font-headline text-xl font-bold text-primary leading-snug group-hover:text-tertiary transition-colors">
            {housing.title}
          </h3>
          <p className="text-sm text-on-surface-variant mt-2 line-clamp-2 leading-relaxed">
            {housing.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge label={`${housing.rooms} Rooms`} icon="bed" />
          <Badge
            label={`${housing.floors} Floor${housing.floors > 1 ? "s" : ""}`}
            icon="layers"
          />
          <Badge
            label={`${housing.familyMembers} Host${housing.familyMembers > 1 ? "s" : ""}`}
            icon="people"
          />
          <Badge
            label={formatDuration(housing.maxStayDays)}
            icon="calendar_month"
          />
        </div>

        <p className="text-[10px] text-outline-variant mt-auto">
          Added {formatDate(housing.createdAt)}
          {housing.updatedAt && ` · Updated ${formatDate(housing.updatedAt)}`}
        </p>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-surface-variant/30">
          <button
            onClick={() => onEdit(housing)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Edit
          </button>
          {confirmDelete ? (
            <div className="flex gap-2 flex-1">
              <button
                onClick={() => {
                  onDelete(housing.id);
                  setConfirmDelete(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-error text-white text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl border border-surface-variant text-on-surface-variant text-xs font-bold uppercase tracking-widest hover:bg-surface-container-high transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-error/40 text-error text-xs font-bold uppercase tracking-widest hover:bg-error hover:text-white transition-all"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between bg-surface-container-low rounded-2xl px-5 py-3">
      <span className="text-sm font-medium text-on-surface">{label}</span>
      <div className="flex items-center gap-3 border border-outline/20 rounded-full px-2 py-1 bg-surface">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-primary disabled:opacity-30"
        >
          <span className="material-symbols-outlined text-base">remove</span>
        </button>
        <span className="font-bold w-6 text-center text-primary">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-primary disabled:opacity-30"
        >
          <span className="material-symbols-outlined text-base">add</span>
        </button>
      </div>
    </div>
  );
}

// ─── Image Uploader ────────────────────────────────────────────────────────────
function ImageUploader({
  images,
  onChange,
  existingImages,
  onRemoveExisting,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
  existingImages: string[];
  onRemoveExisting: (path: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const BASE_URL =
    import.meta.env.VITE_API_URL?.replace("/api", "") ??
    "http://localhost:3000";

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange([...images, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [images],
  );

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
          ${
            dragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-surface-variant hover:border-primary hover:bg-surface-container-low"
          }`}
      >
        <span className="material-symbols-outlined text-4xl text-primary/50 mb-3 block">
          cloud_upload
        </span>
        <p className="text-sm font-bold text-on-surface">
          Drag & drop photos here
        </p>
        <p className="text-xs text-on-surface-variant mt-1">
          or click to browse — JPG, PNG, WEBP
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Existing server images */}
      {existingImages.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Current Photos
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {existingImages.map((src, i) => (
              <div
                key={i}
                className="relative group aspect-square rounded-xl overflow-hidden shadow-md"
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => onRemoveExisting(src)}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New images (base64) */}
      {images.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            New Photos
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {images.map((src, i) => (
              <div
                key={i}
                className="relative group aspect-square rounded-xl overflow-hidden shadow-md"
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Form helpers ──────────────────────────────────────────────────────────────
function SectionLabel({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-primary text-lg">
        {icon}
      </span>
      <h3 className="font-headline text-lg text-primary">{title}</h3>
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="text-xs text-error mt-1 flex items-center gap-1">
      <span className="material-symbols-outlined text-xs">error</span>
      {msg}
    </p>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({
  housing,
  onConfirm,
  onCancel,
  isLoading,
}: {
  housing: Housing;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative z-10 bg-surface-container-lowest w-full max-w-sm rounded-[2rem] shadow-2xl shadow-error/20 p-8 border border-error/20">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-error">
              delete_forever
            </span>
          </div>
          <div>
            <h2 className="font-headline text-xl text-primary">
              Delete Listing?
            </h2>
            <p className="text-sm text-on-surface-variant mt-2">
              <span className="font-semibold text-on-surface">
                "{housing.title}"
              </span>{" "}
              will be permanently removed. This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl border border-surface-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container-high transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 py-3 rounded-xl bg-error text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="material-symbols-outlined text-base animate-spin">
                  refresh
                </span>
              ) : (
                <span className="material-symbols-outlined text-base">
                  delete
                </span>
              )}
              {isLoading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Housing Form Modal ────────────────────────────────────────────────────────
const EMPTY_FORM: HousingFormData = {
  title: "",
  description: "",
  location: "",
  type: "APARTMENT",
  floors: 1,
  rooms: 1,
  familyMembers: 1,
  maxTourists: 1,
  maxStayDays: 7,
  images: [],
  removeImages: [],
};

function HousingModal({
  initial,
  originalImages,
  onClose,
  onSave,
  isSaving,
}: {
  initial: HousingFormData & { id?: string };
  originalImages: string[];
  onClose: () => void;
  onSave: (data: HousingFormData, id?: string) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<HousingFormData>({
    ...initial,
    images: [], // new uploads only; existing managed separately
    removeImages: [],
  });
  const [existingImgs, setExistingImgs] = useState<string[]>(originalImages);
  const [errors, setErrors] = useState<HousingFormErrors>({});
  const isEdit = !!initial.id;

  const set = <K extends keyof HousingFormData>(k: K, v: HousingFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleRemoveExisting = (path: string) => {
    setExistingImgs((prev) => prev.filter((p) => p !== path));
    setForm((f) => ({ ...f, removeImages: [...(f.removeImages ?? []), path] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateHousingForm({ ...form });
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSave({ ...form }, initial.id);
  };

  const inputCls = (field: keyof HousingFormData) =>
    `w-full bg-surface-container-low border rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 transition-all ${
      errors[field]
        ? "border-error focus:ring-error/30"
        : "border-surface-variant/50 focus:border-primary focus:ring-primary/20"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isSaving ? onClose : undefined}
      />
      <div className="relative z-10 bg-surface-container-lowest w-full sm:max-w-2xl max-h-[95dvh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl shadow-primary/20">
        <div className="flex justify-center pt-4 pb-2 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-outline-variant" />
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-headline text-2xl text-primary">
                {isEdit ? "Edit Housing" : "Add New Housing"}
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                {isEdit
                  ? "Update your listing details"
                  : "Share your home with the world"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <section className="space-y-4">
              <SectionLabel icon="home" title="Basic Information" />
              <div>
                <label className="field-label">Housing Title</label>
                <input
                  className={inputCls("title")}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Dar El Jasmin — Medina Hideaway"
                />
                {errors.title && <FieldError msg={errors.title} />}
              </div>
              <div>
                <label className="field-label">Description</label>
                <textarea
                  className={`${inputCls("description")} resize-none`}
                  rows={3}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Describe what makes your home special..."
                />
                {errors.description && <FieldError msg={errors.description} />}
              </div>
            </section>

            {/* Location */}
            <section className="space-y-4">
              <SectionLabel icon="location_on" title="Location" />
              <div>
                <label className="field-label">City or Address</label>
                <LocationAutocomplete
                  value={form.location}
                  onChange={(val) => set("location", val)}
                  error={errors.location}
                  placeholder="e.g. Sidi Bou Said, Tunis"
                />

                {errors.location && <FieldError msg={errors.location} />}
              </div>
            </section>

            {/* Housing Details */}
            <section className="space-y-4">
              <SectionLabel icon="apartment" title="Housing Details" />
              <div>
                <label className="field-label">Type of Housing</label>
                <select
                  className={inputCls("type")}
                  value={form.type}
                  onChange={(e) => set("type", e.target.value as HousingType)}
                >
                  {HOUSING_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {HOUSING_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <Stepper
                  label="Number of Floors"
                  value={form.floors}
                  min={1}
                  max={10}
                  onChange={(v) => set("floors", v)}
                />
                <Stepper
                  label="Number of Rooms"
                  value={form.rooms}
                  min={1}
                  max={20}
                  onChange={(v) => set("rooms", v)}
                />
                <Stepper
                  label="Family Members in Home"
                  value={form.familyMembers}
                  min={1}
                  max={15}
                  onChange={(v) => set("familyMembers", v)}
                />
              </div>
            </section>

            {/* Tourist Capacity */}
            <section className="space-y-4">
              <SectionLabel icon="group" title="Tourist Capacity" />
              <div className="space-y-3">
                <Stepper
                  label="Max Tourists at Once"
                  value={form.maxTourists}
                  min={1}
                  max={20}
                  onChange={(v) => set("maxTourists", v)}
                />
                <Stepper
                  label="Max Stay (days)"
                  value={form.maxStayDays}
                  min={1}
                  max={365}
                  onChange={(v) => set("maxStayDays", v)}
                />
              </div>
            </section>

            {/* Photos */}
            <section className="space-y-4">
              <SectionLabel icon="photo_library" title="Photos" />
              <ImageUploader
                images={form.images}
                onChange={(imgs) => set("images", imgs)}
                existingImages={existingImgs}
                onRemoveExisting={handleRemoveExisting}
              />
            </section>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-surface-variant/30">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 py-4 rounded-xl border border-surface-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container-high transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-4 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100"
              >
                {isSaving ? (
                  <span className="material-symbols-outlined text-base animate-spin">
                    refresh
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-base">
                    {isEdit ? "save" : "publish"}
                  </span>
                )}
                {isSaving
                  ? isEdit
                    ? "Saving…"
                    : "Publishing…"
                  : isEdit
                    ? "Save Changes"
                    : "Publish Housing"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
type ToastVariant = "success" | "error";

function Toast({
  message,
  variant = "success",
  onDone,
}: {
  message: string;
  variant?: ToastVariant;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-[fadeInUp_0.4s_ease]">
      <div
        className={`flex items-center gap-3 ${variant === "error" ? "bg-error" : "bg-primary"} text-white px-6 py-4 rounded-2xl shadow-2xl shadow-primary/30`}
      >
        <span className="material-symbols-outlined">
          {variant === "error" ? "error" : "check_circle"}
        </span>
        <span className="text-sm font-bold">{message}</span>
      </div>
    </div>
  );
}

// ─── Error Banner ──────────────────────────────────────────────────────────────
function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <span className="material-symbols-outlined text-6xl text-error/50">
        cloud_off
      </span>
      <h2 className="font-headline text-2xl text-primary">
        Something went wrong
      </h2>
      <p className="text-on-surface-variant text-sm max-w-xs">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:scale-[1.03] transition-all shadow-lg shadow-primary/20"
      >
        <span className="material-symbols-outlined text-sm">refresh</span>
        Try Again
      </button>
    </div>
  );
}

// ─── Guest Banner ─────────────────────────────────────────────────────────────

function GuestBanner() {
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
              Authentic Tunisian Hospitality
            </span>
          </div>

          {/* Title */}
          <div className="text-center max-w-2xl">
            <h1 className="font-headline text-4xl md:text-5xl italic text-primary leading-tight mb-4">
              Stay With Locals,
              <br />
              Experience Tunisia Authentically
            </h1>

            <p className="text-lg text-on-surface-variant leading-relaxed">
              Discover welcoming Tunisian families opening their homes to
              travellers. Enjoy authentic stays, cultural exchange, and
              unforgettable memories beyond traditional hotels.
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Authentic local hosting",
              "Family-friendly stays",
              "Cultural immersion",
              "Trusted community",
            ].map((tag) => (
              <span
                key={tag}
                className="text-sm px-4 py-2 rounded-full border border-outline-variant/30 text-on-surface-variant bg-surface-container-low"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* CTA */}
          <a
            href="/auth"
            className="px-10 py-4 bg-primary text-on-primary rounded-xl text-sm font-bold uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-95 transition-transform"
          >
            Sign in to Explore Homes
          </a>

          <p className="text-sm text-outline text-center">
            New here?{" "}
            <a href="/auth" className="text-primary font-bold underline">
              Create a free account
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HousingPage() {
  const [housings, setHousings] = useState<Housing[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [modal, setModal] = useState<
    (HousingFormData & { id?: string; _originalImages?: string[] }) | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Housing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const BACKEND_URL = "http://localhost:5000";
  const [currentUser, setCurrentUser] = useState<LocalUser | null | undefined>(
    undefined,
  );

  const toImageUrl = (p?: string) => {
    if (!p) return "/../assets/profile.jpg";
    return p.startsWith("http") ? p : `${BACKEND_URL}${p}`;
  };

  const [toast, setToast] = useState<{
    message: string;
    variant: ToastVariant;
  } | null>(null);

  // ── Read auth from localStorage ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      setCurrentUser(raw ? (JSON.parse(raw) as LocalUser) : null);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    setFetchError(null);
    const res = await housingApi.list();
    if (res.error) setFetchError(res.error);
    else setHousings(res.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser === undefined) return; // wait until auth is known
    if (!currentUser) return; // don't fetch when not logged in
    load();
  }, []);

  // ── Open modals ───────────────────────────────────────────────────────────
  const openAdd = () => setModal({ ...EMPTY_FORM });

  const openEdit = (h: Housing) =>
    setModal({
      id: h.id,
      title: h.title,
      description: h.description,
      location: h.location,
      type: h.type,
      floors: h.floors,
      rooms: h.rooms,
      familyMembers: h.familyMembers,
      maxTourists: h.maxTourists,
      maxStayDays: h.maxStayDays,
      images: [],
      removeImages: [],
      _originalImages: h.images,
    });

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async (data: HousingFormData, id?: string) => {
    setIsSaving(true);
    const res = id
      ? await housingApi.update(id, data)
      : await housingApi.create(data);

    if (res.error) {
      setToast({ message: res.error, variant: "error" });
    } else if (res.data) {
      if (id) {
        setHousings((prev) => prev.map((h) => (h.id === id ? res.data! : h)));
        setToast({
          message: "Housing updated successfully!",
          variant: "success",
        });
      } else {
        setHousings((prev) => [res.data!, ...prev]);
        setToast({
          message: "Housing published successfully!",
          variant: "success",
        });
      }
      setModal(null);
    }
    setIsSaving(false);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeletingId(deleteTarget.id);
    const res = await housingApi.remove(deleteTarget.id);
    if (res.error) {
      setToast({ message: res.error, variant: "error" });
    } else {
      setHousings((prev) => prev.filter((h) => h.id !== deleteTarget.id));
      setToast({ message: "Listing removed.", variant: "success" });
    }
    setIsDeleting(false);
    setDeletingId(null);
    setDeleteTarget(null);
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = [
    { label: "Total Listings", value: housings.length, icon: "home" },
    {
      label: "Total Capacity",
      value: housings.reduce((s, h) => s + h.maxTourists, 0) + " guests",
      icon: "group",
    },
    {
      label: "Avg. Stay",
      value:
        housings.length > 0
          ? Math.round(
              housings.reduce((s, h) => s + h.maxStayDays, 0) / housings.length,
            ) + " days"
          : "—",
      icon: "calendar_month",
    },
    {
      label: "Total Rooms",
      value: housings.reduce((s, h) => s + h.rooms, 0),
      icon: "bed",
    },
  ];

  // ── Auth guards (after all hooks) ──
  if (currentUser === undefined) return null; // reading localStorage, avoid any flash
  if (!currentUser) return <GuestBanner />;

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      <div className="pt-28 pb-32 min-h-screen px-4 md:px-8 max-w-7xl mx-auto">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-tertiary mb-2">
              Host Dashboard
            </p>
            <h1 className="font-headline text-5xl font-black text-primary leading-tight">
              My Housing <span className="italic font-normal">Listings</span>
            </h1>
            <p className="text-on-surface-variant mt-2 text-lg">
              Share your home and welcome tourists from around the world.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="self-start sm:self-auto flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">add_home</span>
            Add Housing
          </button>
        </div>

        {/* ── Stats strip ── */}
        {!loading && !fetchError && housings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-variant/20 shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="material-symbols-outlined text-tertiary text-xl mb-2 block">
                  {stat.icon}
                </span>
                <p className="font-headline text-2xl font-black text-primary">
                  {stat.value}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : fetchError ? (
          <ErrorBanner message={fetchError} onRetry={load} />
        ) : housings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <span className="material-symbols-outlined text-7xl text-outline-variant mb-6">
              house_siding
            </span>
            <h2 className="font-headline text-3xl text-primary mb-2">
              No listings yet
            </h2>
            <p className="text-on-surface-variant mb-8 max-w-sm">
              Start sharing your home with curious travellers exploring
              Tunisia's rich culture.
            </p>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-bold text-sm hover:scale-[1.03] active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined">add_home</span>
              Add Your First Home
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {housings.map((h) => (
              <HousingCard
                key={h.id}
                housing={h}
                onEdit={openEdit}
                onDelete={(id) =>
                  setDeleteTarget(housings.find((x) => x.id === id) ?? null)
                }
                isDeleting={deletingId === h.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modal && (
        <HousingModal
          initial={modal}
          originalImages={modal._originalImages ?? []}
          onClose={() => !isSaving && setModal(null)}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          housing={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !isDeleting && setDeleteTarget(null)}
          isLoading={isDeleting}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDone={() => setToast(null)}
        />
      )}
    </>
  );
}
