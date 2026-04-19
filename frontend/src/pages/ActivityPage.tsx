import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchMyActivities,
  deleteActivity,
  updateActivity,
  createActivity,
  CATEGORY_CONFIG,
  type Activity,
  type ActivityCategory,
  type CreateActivityData,
} from "../services/activityService";
import ImageUploader from "../components/ImageUploader";
import MapPicker from "../components/MapPicker";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVITY_CATEGORIES = Object.keys(CATEGORY_CONFIG) as ActivityCategory[];

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastVariant = "success" | "error";

interface ActivityFormData extends CreateActivityData {
  id?: number;
}

interface ActivityWithReservation extends Activity {
  isReserved?: boolean;
  activeReservationId?: string;
  isCompleted?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | Date): string {
  return new Intl.DateTimeFormat("en-TN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

// ─── Guest Banner ─────────────────────────────────────────────────────────────

function GuestBanner() {
  return (
    <main className="pt-20 min-h-screen w-full bg-surface-container-low">
      <div className="w-full min-h-[calc(100vh-80px)] flex flex-col">
        <div className="flex-1 w-full bg-surface px-6 md:px-20 py-20 flex flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-1.5 bg-amber-50 rounded-full px-4 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 inline-block" />
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">
              Authentic Tunisian Experiences
            </span>
          </div>
          <div className="text-center max-w-2xl">
            <h1 className="font-headline text-4xl md:text-5xl italic text-primary leading-tight mb-4">
              Share Your World,
              <br />
              Curate Unique Experiences
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              Become a local curator and offer unforgettable activities to
              travellers exploring Tunisia's rich culture.
            </p>
          </div>
          <a
            href="/auth"
            className="px-10 py-4 bg-primary text-on-primary rounded-xl text-sm font-bold uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-95 transition-transform"
          >
            Sign in to Manage Activities
          </a>
        </div>
      </div>
    </main>
  );
}

// ─── Skeleton Card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-lg border border-surface-variant/20 flex flex-col animate-pulse">
      <div className="aspect-[4/3] bg-surface-container-high" />
      <div className="p-6 flex flex-col gap-4">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-surface-container-high rounded-full" />
          <div className="h-5 w-3/4 bg-surface-container-high rounded-full" />
          <div className="h-3 w-full bg-surface-container-high rounded-full" />
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

// ─── Badge ─────────────────────────────────────────────────────────────────────

function Badge({ label, icon }: { label: string; icon: string }) {
  return (
    <span className="inline-flex items-center gap-1 bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
      <span className="material-symbols-outlined text-xs">{icon}</span>
      {label}
    </span>
  );
}

// ─── Activity Card ─────────────────────────────────────────────────────────────

function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onView,
  onComplete,
  isDeleting,
  isCompleting,
}: {
  activity: ActivityWithReservation;
  onEdit: (a: Activity) => void;
  onDelete: (id: number) => void;
  onView: (a: Activity) => void;
  onComplete: (reservationId: string, activityId: number) => void;
  isDeleting: boolean;
  isCompleting: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const catConfig = CATEGORY_CONFIG[activity.category];

  const formattedDate = new Date(activity.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article
      className={`group bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-lg shadow-primary/5 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 border border-surface-variant/20 flex flex-col ${
        isDeleting ? "opacity-50 pointer-events-none scale-95" : ""
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {activity.images[0] ? (
          <img
            src={activity.images[0]}
            alt={activity.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-outline-variant">
              {catConfig?.icon ?? "event"}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Category badge */}
        <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">
            {catConfig?.icon ?? "event"}
          </span>
          {catConfig?.label ?? activity.category}
        </span>

        {/* Availability badge */}
        {activity.isCompleted ? (
          <span className="absolute top-4 right-4 flex items-center gap-1.5 bg-surface-container-lowest/90 backdrop-blur-md text-on-surface-variant text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-surface-variant/40">
            <span className="material-symbols-outlined text-sm">task_alt</span>
            Completed
          </span>
        ) : activity.isReserved ? (
          <span className="absolute top-4 right-4 flex items-center gap-1.5 bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
            Reserved
          </span>
        ) : (
          <span className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
            Available
          </span>
        )}

        {/* Price */}
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow text-right">
          <span className="text-lg font-black text-primary">
            {activity.price}
          </span>
          <span className="text-[10px] font-bold text-on-surface-variant ml-1">
            TND
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col flex-1 gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-tertiary flex items-center gap-1 mb-1">
            <span className="material-symbols-outlined text-xs">
              location_on
            </span>
            {activity.location}
          </p>
          <h3 className="font-headline text-xl font-bold text-primary leading-snug group-hover:text-tertiary transition-colors">
            {activity.title}
          </h3>
          <p className="text-sm text-on-surface-variant mt-2 line-clamp-2 leading-relaxed">
            {activity.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge label={`${activity.capacity} People`} icon="group" />
          <Badge label={formattedDate} icon="calendar_month" />
          <Badge label={`${activity.price} TND`} icon="payments" />
        </div>

        {/* Mark as complete banner — only when reserved */}
        {activity.isReserved &&
          activity.activeReservationId &&
          !activity.isCompleted && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <span className="material-symbols-outlined text-amber-600 text-lg shrink-0">
                event_available
              </span>
              <p className="text-xs text-amber-800 font-medium flex-1 leading-snug">
                A tourist has booked this activity. Mark as complete when it
                ends.
              </p>
              <button
                onClick={() =>
                  onComplete(activity.activeReservationId!, activity.id)
                }
                disabled={isCompleting}
                className="shrink-0 flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl transition-all"
              >
                {isCompleting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-sm">
                    check_circle
                  </span>
                )}
                Done
              </button>
            </div>
          )}

        {/* Completed archive notice */}
        {activity.isCompleted && (
          <div className="flex items-center gap-3 bg-surface-container-low border border-surface-variant/30 rounded-2xl px-4 py-3">
            <span className="material-symbols-outlined text-outline text-lg shrink-0">
              archive
            </span>
            <p className="text-xs text-on-surface-variant font-medium flex-1 leading-snug">
              This activity has been completed and is archived.
            </p>
          </div>
        )}

        <p className="text-[10px] text-outline-variant mt-auto">
          Added {formatDate(activity.createdAt)}
        </p>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-surface-variant/30">
          <button
            onClick={() => onView(activity)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-surface-variant text-on-surface-variant text-xs font-bold uppercase tracking-widest hover:bg-surface-container-high transition-all"
          >
            <span className="material-symbols-outlined text-sm">
              visibility
            </span>
          </button>
          <button
            onClick={() => onEdit(activity)}
            disabled={activity.isCompleted}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Edit
          </button>
          {confirmDelete ? (
            <div className="flex gap-2 flex-1">
              <button
                onClick={() => {
                  onDelete(activity.id);
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

// ─── Toast ─────────────────────────────────────────────────────────────────────

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

// ─── Section label / field error helpers ─────────────────────────────────────

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

// ─── Activity Form Modal ───────────────────────────────────────────────────────

type FormErrors = Partial<Record<keyof CreateActivityData, string>>;

function validateForm(data: CreateActivityData): FormErrors {
  const errors: FormErrors = {};
  if (!data.title.trim() || data.title.trim().length < 5)
    errors.title = "Title must be at least 5 characters.";
  if (!data.description.trim() || data.description.trim().length < 20)
    errors.description = "Description must be at least 20 characters.";
  if (!data.location.trim()) errors.location = "Location is required.";
  if (!data.price || data.price < 1)
    errors.price = "Price must be at least 1 TND.";
  if (!data.capacity || data.capacity < 1)
    errors.capacity = "Capacity must be at least 1.";
  if (!data.date) errors.date = "Date is required.";
  return errors;
}

function ActivityModal({
  initial,
  onClose,
  onSave,
  isSaving,
}: {
  initial: ActivityFormData;
  onClose: () => void;
  onSave: (data: CreateActivityData, id?: number) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<CreateActivityData>({
    title: initial.title ?? "",
    description: initial.description ?? "",
    location: initial.location ?? "",
    latitude: initial.latitude ?? 36.8,
    longitude: initial.longitude ?? 10.18,
    category: initial.category ?? ("CULTURE" as ActivityCategory),
    price: initial.price ?? 50,
    capacity: initial.capacity ?? 5,
    date: initial.date
      ? new Date(initial.date).toISOString().slice(0, 16)
      : new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    images: initial.images ?? [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const isEdit = !!initial.id;

  const set = <K extends keyof CreateActivityData>(
    k: K,
    v: CreateActivityData[K],
  ) => setForm((f) => ({ ...f, [k]: v }));

  const inputCls = (field: keyof CreateActivityData) =>
    `w-full bg-surface-container-low border rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 transition-all ${
      errors[field]
        ? "border-error focus:ring-error/30"
        : "border-surface-variant/50 focus:border-primary focus:ring-primary/20"
    }`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSave(
      { ...form, date: new Date(form.date as string).toISOString() },
      initial.id,
    );
  };

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
                {isEdit ? "Edit Activity" : "Add New Activity"}
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                {isEdit
                  ? "Update your activity details"
                  : "Share a unique experience with travellers"}
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
              <SectionLabel icon="event" title="Basic Information" />
              <div>
                <label className="field-label">Activity Title</label>
                <input
                  className={inputCls("title")}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Pottery Workshop in the Medina"
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
                  placeholder="Describe what participants will experience..."
                />
                {errors.description && <FieldError msg={errors.description} />}
              </div>
            </section>

            {/* Category & Capacity */}
            <section className="space-y-4">
              <SectionLabel icon="category" title="Activity Details" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Category</label>
                  <select
                    className={inputCls("category")}
                    value={form.category}
                    onChange={(e) =>
                      set("category", e.target.value as ActivityCategory)
                    }
                  >
                    {ACTIVITY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_CONFIG[cat].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label">Max Participants</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    className={inputCls("capacity")}
                    value={form.capacity}
                    onChange={(e) => set("capacity", Number(e.target.value))}
                  />
                  {errors.capacity && <FieldError msg={errors.capacity} />}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Price (TND / person)</label>
                  <input
                    type="number"
                    min={1}
                    step={0.1}
                    className={inputCls("price")}
                    value={form.price}
                    onChange={(e) => set("price", Number(e.target.value))}
                  />
                  {errors.price && <FieldError msg={errors.price} />}
                </div>
                <div>
                  <label className="field-label">Date & Time</label>
                  <input
                    type="datetime-local"
                    className={inputCls("date")}
                    value={form.date as string}
                    onChange={(e) => set("date", e.target.value)}
                  />
                  {errors.date && <FieldError msg={errors.date} />}
                </div>
              </div>
            </section>

            {/* Location */}
            <section className="space-y-4">
              <SectionLabel icon="location_on" title="Location" />
              <div>
                <label className="field-label">City or Address</label>
                <input
                  className={inputCls("location")}
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="e.g. Sidi Bou Said, Tunis"
                />
                {errors.location && <FieldError msg={errors.location} />}
              </div>
              <MapPicker
                latitude={form.latitude}
                longitude={form.longitude}
                onLocationChange={(lat, lng) => {
                  set("latitude", lat);
                  set("longitude", lng);
                }}
                height="220px"
              />
            </section>

            {/* Photos */}
            <section className="space-y-4">
              <SectionLabel icon="photo_library" title="Photos" />
              <ImageUploader
                images={form.images}
                onImagesChange={(imgs) => set("images", imgs)}
              />
            </section>

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
                    : "Publish Activity"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({
  activity,
  onConfirm,
  onCancel,
  isLoading,
}: {
  activity: Activity;
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
              Delete Activity?
            </h2>
            <p className="text-sm text-on-surface-variant mt-2">
              <span className="font-semibold text-on-surface">
                "{activity.title}"
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

// ─── Activity Detail Modal ─────────────────────────────────────────────────────

function ActivityDetailModal({
  activity,
  onClose,
  onEdit,
}: {
  activity: ActivityWithReservation;
  onClose: () => void;
  onEdit: (a: Activity) => void;
}) {
  const catConfig = CATEGORY_CONFIG[activity.category];
  const [currentImg, setCurrentImg] = useState(0);

  const formattedDate = new Date(activity.date).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 bg-surface-container-lowest w-full sm:max-w-2xl max-h-[95dvh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl shadow-primary/20">
        <div className="flex justify-center pt-4 pb-2 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-outline-variant" />
        </div>

        {/* Image gallery */}
        <div className="relative aspect-[16/9] overflow-hidden sm:rounded-t-[2.5rem]">
          {activity.images.length > 0 ? (
            <>
              <img
                src={activity.images[currentImg]}
                alt={activity.title}
                className="w-full h-full object-cover transition-all duration-500"
              />
              {activity.images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setCurrentImg((i) =>
                        i === 0 ? activity.images.length - 1 : i - 1,
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">
                      chevron_left
                    </span>
                  </button>
                  <button
                    onClick={() =>
                      setCurrentImg((i) =>
                        i === activity.images.length - 1 ? 0 : i + 1,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">
                      chevron_right
                    </span>
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {activity.images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImg(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === currentImg
                            ? "bg-white scale-125"
                            : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-outline-variant">
                {catConfig?.icon ?? "event"}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          {/* Overlays */}
          <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow flex items-center gap-1 pointer-events-none">
            <span className="material-symbols-outlined text-sm">
              {catConfig?.icon ?? "event"}
            </span>
            {catConfig?.label ?? activity.category}
          </span>

          {/* Availability badge */}
          {activity.isCompleted ? (
            <span className="absolute top-4 right-4 flex items-center gap-1.5 bg-surface-container-lowest/90 backdrop-blur-md text-on-surface-variant text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-surface-variant/40 pointer-events-none">
              <span className="material-symbols-outlined text-sm">
                task_alt
              </span>
              Completed
            </span>
          ) : activity.isReserved ? (
            <span className="absolute top-4 right-4 flex items-center gap-1.5 bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
              Reserved
            </span>
          ) : (
            <span className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
              Available
            </span>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-all"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-tertiary flex items-center gap-1 mb-1">
              <span className="material-symbols-outlined text-xs">
                location_on
              </span>
              {activity.location}
            </p>
            <h2 className="font-headline text-3xl font-bold text-primary leading-snug">
              {activity.title}
            </h2>
            <p className="text-sm text-on-surface-variant mt-3 leading-relaxed">
              {activity.description}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                icon: "payments",
                label: "Price",
                value: `${activity.price} TND`,
              },
              {
                icon: "group",
                label: "Capacity",
                value: `${activity.capacity} people`,
              },
              { icon: "calendar_month", label: "Date", value: formattedDate },
              {
                icon: "schedule",
                label: "Added",
                value: formatDate(activity.createdAt),
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-surface-container-low rounded-2xl p-4 border border-surface-variant/20"
              >
                <span className="material-symbols-outlined text-base text-tertiary block mb-1">
                  {s.icon}
                </span>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-0.5">
                  {s.label}
                </p>
                <p className="text-sm font-bold text-primary">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-surface-variant/30">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl border border-surface-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container-high transition-all"
            >
              Close
            </button>
            {!activity.isCompleted && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(activity);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-base">
                  edit
                </span>
                Edit Activity
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

interface LocalUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

export default function ActivityPage() {
  const navigate = useNavigate();

  const [activities, setActivities] = useState<ActivityWithReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [modal, setModal] = useState<ActivityFormData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [viewTarget, setViewTarget] = useState<ActivityWithReservation | null>(
    null,
  );

  const [toast, setToast] = useState<{
    message: string;
    variant: ToastVariant;
  } | null>(null);

  const [currentUser, setCurrentUser] = useState<LocalUser | null | undefined>(
    undefined,
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      setCurrentUser(raw ? (JSON.parse(raw) as LocalUser) : null);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const load = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await fetchMyActivities();

      // Fetch reservation status for each activity
      const token = localStorage.getItem("token");
      const withStatus = await Promise.all(
        data.map(async (a) => {
          try {
            const res = await fetch(
              `http://localhost:5000/api/activity-reservations/activity/${a.id}`,
              { headers: token ? { Authorization: `Bearer ${token}` } : {} },
            );
            const reservations: any[] = await res.json();
            const accepted = reservations.find((r) => r.status === "ACCEPTED");
            const hasCompleted = reservations.some(
              (r) => r.status === "COMPLETED",
            );
            // isCompleted = had a completed reservation and no active one
            const isCompleted = hasCompleted && !accepted;
            return {
              ...a,
              isReserved: !!accepted,
              activeReservationId: accepted?.id ?? undefined,
              isCompleted,
            };
          } catch {
            return { ...a, isReserved: false, isCompleted: false };
          }
        }),
      );

      setActivities(withStatus);
    } catch (err: any) {
      setFetchError(
        err?.response?.data?.message ?? "Failed to load activities.",
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser === undefined) return;
    if (!currentUser) return;
    load();
  }, [currentUser]);

  const openAdd = () => navigate("/host");

  const openEdit = (a: Activity) =>
    setModal({
      id: a.id,
      title: a.title,
      description: a.description,
      location: a.location,
      latitude: a.latitude,
      longitude: a.longitude,
      category: a.category,
      price: a.price,
      capacity: a.capacity,
      date: new Date(a.date).toISOString().slice(0, 16),
      images: [...a.images],
    });

  const handleSave = async (data: CreateActivityData, id?: number) => {
    setIsSaving(true);
    try {
      if (id) {
        await updateActivity(id, data);
        setActivities((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...data } : a)),
        );
        setToast({
          message: "Activity updated successfully!",
          variant: "success",
        });
      } else {
        const created = await createActivity(data);
        setActivities((prev) => [
          { ...created, isReserved: false, isCompleted: false },
          ...prev,
        ]);
        setToast({
          message: "Activity published! Pending admin approval.",
          variant: "success",
        });
      }
      setModal(null);
    } catch (err: any) {
      setToast({
        message: err?.response?.data?.message ?? "Failed to save activity.",
        variant: "error",
      });
    }
    setIsSaving(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeletingId(deleteTarget.id);
    try {
      await deleteActivity(deleteTarget.id);
      setActivities((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setToast({ message: "Activity removed.", variant: "success" });
    } catch (err: any) {
      setToast({
        message: err?.response?.data?.message ?? "Failed to delete activity.",
        variant: "error",
      });
    }
    setIsDeleting(false);
    setDeletingId(null);
    setDeleteTarget(null);
  };

  // ── Mark reservation as complete ─────────────────────────────────────────────
  const handleComplete = async (reservationId: string, activityId: number) => {
    setCompletingId(activityId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `http://localhost:5000/api/activity-reservations/${reservationId}/complete`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      if (!res.ok) throw new Error("Failed");
      setActivities((prev) =>
        prev.map((a) =>
          a.id === activityId
            ? {
                ...a,
                isReserved: false,
                activeReservationId: undefined,
                isCompleted: true,
              }
            : a,
        ),
      );
      setToast({ message: "Activity marked as complete!", variant: "success" });
    } catch {
      setToast({ message: "Failed to complete activity.", variant: "error" });
    }
    setCompletingId(null);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const availableCount = activities.filter(
    (a) => !a.isReserved && !a.isCompleted,
  ).length;
  const reservedCount = activities.filter((a) => a.isReserved).length;
  const completedCount = activities.filter((a) => a.isCompleted).length;

  const stats = [
    {
      label: "Total Activities",
      value: activities.length,
      icon: "travel_explore",
      highlight: undefined,
    },
    {
      label: "Available",
      value: availableCount,
      icon: "check_circle",
      highlight: "text-emerald-600",
    },
    {
      label: "Reserved",
      value: reservedCount,
      icon: "event_available",
      highlight: "text-rose-600",
    },
    {
      label: "Completed",
      value: completedCount,
      icon: "task_alt",
      highlight: "text-blue-500",
    },
  ];

  // ── Split activities into active vs archived ───────────────────────────────
  const activeActivities = activities.filter((a) => !a.isCompleted);
  const archivedActivities = activities.filter((a) => a.isCompleted);

  if (currentUser === undefined) return null;
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
              Curator Dashboard
            </p>
            <h1 className="font-headline text-5xl font-black text-primary leading-tight">
              My Activity <span className="italic font-normal">Listings</span>
            </h1>
            <p className="text-on-surface-variant mt-2 text-lg">
              Create and manage your unique local experiences for travellers.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 self-start sm:self-auto">
            <Link
              to="/explore"
              className="flex items-center gap-2 border border-primary text-primary px-6 py-3.5 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
            >
              <span className="material-symbols-outlined text-sm">explore</span>
              Explore Activities
            </Link>
            <button
              onClick={openAdd}
              className="flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">add_task</span>
              Add Activity
            </button>
          </div>
        </div>

        {/* ── Stats strip ── */}
        {!loading && !fetchError && activities.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-variant/20 shadow-sm hover:shadow-md transition-shadow"
              >
                <span
                  className={`material-symbols-outlined text-xl mb-2 block ${stat.highlight ?? "text-tertiary"}`}
                >
                  {stat.icon}
                </span>
                <p
                  className={`font-headline text-2xl font-black ${stat.highlight ?? "text-primary"}`}
                >
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
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <span className="material-symbols-outlined text-7xl text-outline-variant mb-6">
              event_note
            </span>
            <h2 className="font-headline text-3xl text-primary mb-2">
              No activities yet
            </h2>
            <p className="text-on-surface-variant mb-8 max-w-sm">
              Start curating unique local experiences for travellers exploring
              Tunisia.
            </p>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-bold text-sm hover:scale-[1.03] active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined">add_task</span>
              Add Your First Activity
            </button>
          </div>
        ) : (
          <>
            {/* ── Active activities grid ── */}
            {activeActivities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeActivities.map((a) => (
                  <ActivityCard
                    key={a.id}
                    activity={a}
                    onView={(act) =>
                      setViewTarget(act as ActivityWithReservation)
                    }
                    onEdit={openEdit}
                    onDelete={(id) =>
                      setDeleteTarget(
                        activities.find((x) => x.id === id) ?? null,
                      )
                    }
                    onComplete={handleComplete}
                    isDeleting={deletingId === a.id}
                    isCompleting={completingId === a.id}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">
                  event_note
                </span>
                <p className="text-on-surface-variant text-sm">
                  No active activities. All done for now!
                </p>
              </div>
            )}

            {/* ── Archived / Completed section ── */}
            {archivedActivities.length > 0 && (
              <>
                <div className="flex items-center gap-4 mt-16 mb-8">
                  <div className="flex-1 h-px bg-surface-variant/40" />
                  <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-outline-variant whitespace-nowrap">
                    <span className="material-symbols-outlined text-sm">
                      archive
                    </span>
                    Completed Activities
                  </span>
                  <div className="flex-1 h-px bg-surface-variant/40" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-55">
                  {archivedActivities.map((a) => (
                    <ActivityCard
                      key={a.id}
                      activity={a}
                      onView={(act) =>
                        setViewTarget(act as ActivityWithReservation)
                      }
                      onEdit={openEdit}
                      onDelete={(id) =>
                        setDeleteTarget(
                          activities.find((x) => x.id === id) ?? null,
                        )
                      }
                      onComplete={handleComplete}
                      isDeleting={deletingId === a.id}
                      isCompleting={completingId === a.id}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {modal && (
        <ActivityModal
          initial={modal}
          onClose={() => !isSaving && setModal(null)}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          activity={deleteTarget}
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

      {viewTarget && (
        <ActivityDetailModal
          activity={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={(a) => {
            setViewTarget(null);
            openEdit(a);
          }}
        />
      )}
    </>
  );
}
