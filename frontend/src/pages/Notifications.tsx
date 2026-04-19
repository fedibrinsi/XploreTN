import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import notifBannerImg from "../assets/message2.jpg";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType =
  | "RESERVATION_REQUESTED"
  | "RESERVATION_ACCEPTED"
  | "RESERVATION_REJECTED"
  | "RESERVATION_CANCELLED"
  | "RESERVATION_COMPLETED";

interface HousingNotification {
  id: string;
  kind: "housing";
  type: NotifType;
  isRead: boolean;
  createdAt: string;
  housing: {
    id: string;
    title: string;
    location: string;
    images: string[];
    type: string;
  };
  reservation: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    tourist: { id: number; fullName: string; image?: string } | null;
  };
}

interface ActivityNotification {
  id: string;
  kind: "activity";
  type: NotifType;
  isRead: boolean;
  createdAt: string;
  activity: {
    id: number;
    title: string;
    location: string;
    images: string[];
    category: string;
    date: string;
  };
  reservation: {
    id: string;
    status: string;
    guests: number;
    notes?: string;
    tourist: { id: number; fullName: string; image?: string } | null;
  };
}

type Notification = HousingNotification | ActivityNotification;
type FilterTab = "all" | "housing" | "activity" | "unread";
type ToastMode = "confirm" | "success" | null;

function getActorLabel(type: NotifType): string {
  switch (type) {
    case "RESERVATION_REQUESTED":
      return "Requested by";
    case "RESERVATION_CANCELLED":
      return "Cancelled by";
    case "RESERVATION_ACCEPTED":
      return "Accepted by";
    case "RESERVATION_REJECTED":
      return "Rejected by";
    case "RESERVATION_COMPLETED":
      return "Completed by";
  }
}
// ─── Toast Components ─────────────────────────────────────────────────────────

function ClearAllToast({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [exiting, setExiting] = useState(false);

  const handleCancel = () => {
    setExiting(true);
    setTimeout(onCancel, 300);
  };

  const handleConfirm = () => {
    setExiting(true);
    setTimeout(onConfirm, 200);
  };

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-3 px-5 py-3.5
        bg-gray-900 text-white rounded-2xl shadow-2xl
        border border-white/10
        transition-all duration-300
        ${exiting ? "opacity-0 translate-y-4 scale-95" : "opacity-100 translate-y-0 scale-100"}
      `}
      style={{ animation: exiting ? undefined : "toastIn 0.3s ease" }}
    >
      <span className="material-symbols-outlined text-red-400 text-[18px]">
        delete_sweep
      </span>
      <p className="text-sm font-medium whitespace-nowrap">
        Delete all notifications?
      </p>
      <div className="flex items-center gap-2 ml-1">
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition-colors"
        >
          Delete all
        </button>
      </div>
    </div>
  );
}

function SuccessToast({
  message,
  onDone,
}: {
  message: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-3 px-5 py-3.5
        bg-gray-900 text-white rounded-2xl shadow-2xl
        border border-white/10"
      style={{ animation: "toastIn 0.3s ease" }}
    >
      <span className="material-symbols-outlined text-emerald-400 text-[18px]">
        check_circle
      </span>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  NotifType,
  { label: string; bg: string; text: string; icon: string }
> = {
  RESERVATION_REQUESTED: {
    label: "New request",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: "mark_email_unread",
  },
  RESERVATION_ACCEPTED: {
    label: "Accepted",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: "check_circle",
  },
  RESERVATION_REJECTED: {
    label: "Rejected",
    bg: "bg-red-50",
    text: "text-red-600",
    icon: "cancel",
  },
  RESERVATION_CANCELLED: {
    label: "Cancelled",
    bg: "bg-slate-50",
    text: "text-slate-500",
    icon: "block",
  },
  RESERVATION_COMPLETED: {
    label: "Completed",
    bg: "bg-violet-50",
    text: "text-violet-700",
    icon: "verified",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  ART_HERITAGE: "Art & Heritage",
  GASTRONOMY: "Gastronomy",
  COASTAL_ESCAPE: "Coastal Escape",
  HISTORICAL_TOUR: "Historical Tour",
  ARTISAN_WORKSHOP: "Artisan Workshop",
  DESERT_EXPEDITION: "Desert Expedition",
  NATURE_ADVENTURE: "Nature & Adventure",
  CULTURAL_EVENT: "Cultural Event",
  WELLNESS: "Wellness",
  OTHER: "Other",
};

const HOUSING_LABELS: Record<string, string> = {
  APARTMENT: "Apartment",
  VILLA: "Villa",
  STUDIO: "Studio",
  TRADITIONAL_HOUSE: "Traditional House",
  FARM_STAY: "Farm Stay",
  GUESTHOUSE: "Guesthouse",
  RIAD: "Riad",
  CHALET: "Chalet",
};

const BACKEND_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Guest Banner ─────────────────────────────────────────────────────────────

function GuestBanner() {
  return (
    <main className="pt-20 min-h-screen w-full bg-surface-container-low">
      <div className="w-full min-h-[calc(100vh-80px)] flex flex-col">
        <div className="w-full h-[45vh] relative overflow-hidden">
          <img
            src={notifBannerImg}
            alt="Notifications"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50" />
        </div>

        <div className="flex-1 w-full bg-surface px-6 md:px-20 py-12 flex flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
              Stay in the loop
            </span>
          </div>

          <div className="text-center max-w-2xl">
            <h1 className="font-headline text-4xl md:text-5xl text-primary leading-tight mb-4">
              Your Notifications Hub
            </h1>
            <p className="text-lg text-on-surface-variant leading-relaxed">
              Sign in to receive real-time updates on the status of your housing
              and activity reservation requests — acceptances, rejections,
              cancellations and more.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {[
              { icon: "home", label: "Housing requests" },
              { icon: "event", label: "Activity bookings" },
              { icon: "check_circle", label: "Acceptance alerts" },
              { icon: "notifications_active", label: "Real-time updates" },
            ].map((item) => (
              <span
                key={item.label}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-outline-variant/30 text-on-surface-variant bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-primary text-base">
                  {item.icon}
                </span>
                {item.label}
              </span>
            ))}
          </div>

          <a
            href="/auth"
            className="mt-2 px-10 py-4 bg-primary text-white rounded-xl text-sm font-bold uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-95 transition-transform"
          >
            Sign in to view notifications
          </a>
        </div>
      </div>
    </main>
  );
}

// ─── Notification Card ────────────────────────────────────────────────────────

function NotificationCard({
  notif,
  onRead,
  onDelete,
}: {
  notif: Notification;
  onRead: (id: string, kind: "housing" | "activity") => void;
  onDelete: (id: string, kind: "housing" | "activity") => void;
}) {
  const cfg = TYPE_CONFIG[notif.type];
  const isHousing = notif.kind === "housing";

  const image = isHousing
    ? (notif as HousingNotification).housing.images?.[0]
    : (notif as ActivityNotification).activity.images?.[0];

  const title = isHousing
    ? (notif as HousingNotification).housing.title
    : (notif as ActivityNotification).activity.title;

  const subtitle = isHousing
    ? HOUSING_LABELS[(notif as HousingNotification).housing.type] ||
      (notif as HousingNotification).housing.type
    : CATEGORY_LABELS[(notif as ActivityNotification).activity.category] ||
      (notif as ActivityNotification).activity.category;

  const location = isHousing
    ? (notif as HousingNotification).housing.location
    : (notif as ActivityNotification).activity.location;

  const resolveImage = (src: string) =>
    src?.startsWith("http") ? src : `${BACKEND_URL}${src}`;

  return (
    <div
      onClick={() => !notif.isRead && onRead(notif.id, notif.kind)}
      className={`
        relative flex items-center gap-4 p-5 rounded-[1.5rem]
        border transition-all duration-200 group
        ${
          notif.isRead
            ? "bg-surface border-outline-variant/20 cursor-default"
            : "bg-surface border-primary/20 cursor-pointer hover:-translate-y-0.5 hover:shadow-md shadow-primary/5 ring-1 ring-primary/10"
        }
      `}
    >
      {!notif.isRead && (
        <span className="absolute top-4 right-12 w-2 h-2 rounded-full bg-primary animate-pulse" />
      )}

      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-surface-container-high flex-shrink-0">
        {image ? (
          <img
            src={resolveImage(image)}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-on-surface-variant/40">
              {isHousing ? "home" : "event"}
            </span>
          </div>
        )}
        <span
          className={`absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center border-2 border-surface text-[10px] font-bold
            ${isHousing ? "bg-primary text-white" : "bg-amber-500 text-white"}`}
        >
          <span className="material-symbols-outlined text-[11px]">
            {isHousing ? "home" : "explore"}
          </span>
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide mb-2 ${cfg.bg} ${cfg.text}`}
        >
          <span className="material-symbols-outlined text-[12px]">
            {cfg.icon}
          </span>
          {cfg.label}
        </span>

        <p className="font-semibold text-sm text-on-surface truncate leading-snug">
          {title}
        </p>

        <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1 flex-wrap">
          <span>{subtitle}</span>
          <span className="text-outline">·</span>
          <span className="material-symbols-outlined text-[12px] text-primary/60">
            location_on
          </span>
          <span className="truncate">{location}</span>
        </p>

        {isHousing ? (
          <p className="text-[11px] text-outline mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[11px]">
              calendar_today
            </span>
            {formatDate((notif as HousingNotification).reservation.startDate)} →{" "}
            {formatDate((notif as HousingNotification).reservation.endDate)}
          </p>
        ) : (
          <p className="text-[11px] text-outline mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[11px]">group</span>
            {(notif as ActivityNotification).reservation.guests} participant
            {(notif as ActivityNotification).reservation.guests > 1
              ? "s"
              : ""}{" "}
            ·{" "}
            <span className="material-symbols-outlined text-[11px]">
              calendar_today
            </span>
            {formatDate((notif as ActivityNotification).activity.date)}
          </p>
        )}
        {/* Actor line */}
        {notif.reservation?.tourist && (
          <p className="text-[11px] text-outline mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[11px]">
              person
            </span>
            <span className="font-medium text-on-surface-variant">
              {getActorLabel(notif.type)}:
            </span>
            <span className="font-semibold text-primary/80">
              {notif.reservation.tourist.fullName}
            </span>
          </p>
        )}
      </div>

      <div className="flex-shrink-0 flex flex-col items-end justify-between gap-3 self-stretch">
        <span className="text-[10px] font-bold uppercase tracking-wider text-outline whitespace-nowrap">
          {timeAgo(notif.createdAt)}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notif.id, notif.kind);
          }}
          className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-full border border-outline-variant/30 text-outline hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
          title="Delete"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse flex items-center gap-4 p-5 rounded-[1.5rem] border border-outline-variant/20 bg-surface">
      <div className="w-14 h-14 rounded-xl bg-surface-container-high flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 bg-surface-container-high rounded-full" />
        <div className="h-4 w-3/5 bg-surface-container-high rounded-full" />
        <div className="h-3 w-2/5 bg-surface-container-high rounded-full" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Notifications() {
  const storedUser = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMode, setToastMode] = useState<ToastMode>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !user) return;
    const socket = io(BACKEND_URL, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;
    socket.on("notification", (newNotif: Notification) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });
    return () => {
      socket.disconnect();
    };
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`${BACKEND_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(data);
    } catch {
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleRead = async (id: string, kind: "housing" | "activity") => {
    try {
      await axios.patch(
        `${BACKEND_URL}/api/notifications/${kind}/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      /* silent */
    }
  };

  const handleDelete = async (id: string, kind: "housing" | "activity") => {
    try {
      await axios.delete(`${BACKEND_URL}/api/notifications/${kind}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      /* silent */
    }
  };

  const handleReadAll = async () => {
    setActionLoading(true);
    try {
      await axios.patch(
        `${BACKEND_URL}/api/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Clear all: toast flow ────────────────────────────────────────────────
  const handleClearAllClick = () => setToastMode("confirm");

  const handleClearConfirm = async () => {
    setToastMode(null);
    setActionLoading(true);
    try {
      await axios.delete(`${BACKEND_URL}/api/notifications/clear-all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
      setToastMode("success");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearCancel = () => setToastMode(null);

  if (!token || !user) return <GuestBanner />;

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const housingCount = notifications.filter((n) => n.kind === "housing").length;
  const activityCount = notifications.filter(
    (n) => n.kind === "activity",
  ).length;

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "housing") return n.kind === "housing";
    if (filter === "activity") return n.kind === "activity";
    return true;
  });

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: notifications.length },
    { key: "unread", label: "Unread", count: unreadCount },
    { key: "housing", label: "Housing", count: housingCount },
    { key: "activity", label: "Activities", count: activityCount },
  ];

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(16px) scale(0.95); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>

      <main className="pt-32 pb-24 w-full px-6 md:px-12 xl:px-20">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary/60 mb-2">
                Your activity
              </p>
              <h1 className="font-headline text-5xl font-light text-on-surface leading-tight">
                Notifica
                <span className="font-semibold text-primary">tions</span>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center ml-3 w-8 h-8 rounded-full bg-primary text-white text-sm font-bold align-middle">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-on-surface-variant text-sm font-light mt-2">
                Housing &amp; activity reservation updates
              </p>
            </div>

            <div className="flex items-center gap-2 mt-4 flex-wrap">
              {unreadCount > 0 && (
                <button
                  onClick={handleReadAll}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-primary/30 bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary/10 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">
                    done_all
                  </span>
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAllClick}
                  disabled={actionLoading || toastMode === "confirm"}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-sm">
                    delete_sweep
                  </span>
                  Clear all
                </button>
              )}
              <button
                onClick={fetchNotifications}
                disabled={loading}
                title="Refresh"
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-outline-variant/30 bg-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                <span
                  className={`material-symbols-outlined text-base text-on-surface-variant ${loading ? "animate-spin" : ""}`}
                >
                  refresh
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-1.5 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/20 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`
                flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200
                ${
                  filter === tab.key
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }
              `}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                    ${filter === tab.key ? "bg-white/25 text-white" : "bg-surface-container-high text-on-surface-variant"}`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 rounded-2xl border border-dashed border-red-200 bg-red-50/50">
            <span className="material-symbols-outlined text-5xl text-red-400">
              cloud_off
            </span>
            <p className="font-semibold text-red-600">{error}</p>
            <button
              onClick={fetchNotifications}
              className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-outline-variant/40 bg-surface/50 text-center gap-3">
            <span className="material-symbols-outlined text-6xl text-outline-variant/60">
              {filter === "unread"
                ? "mark_email_read"
                : filter === "housing"
                  ? "home_work"
                  : filter === "activity"
                    ? "event_available"
                    : "notifications"}
            </span>
            <p className="font-headline text-xl text-primary font-light">
              {filter === "unread" ? "All caught up!" : "Nothing here yet"}
            </p>
            <p className="text-sm text-on-surface-variant max-w-xs">
              {filter === "unread"
                ? "You're all up to date — no unread notifications."
                : "Notifications about your reservations will appear here."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((notif) => (
              <NotificationCard
                key={notif.id}
                notif={notif}
                onRead={handleRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      </main>

      {/* Toasts */}
      {toastMode === "confirm" && (
        <ClearAllToast
          onConfirm={handleClearConfirm}
          onCancel={handleClearCancel}
        />
      )}
      {toastMode === "success" && (
        <SuccessToast
          message="All notifications deleted"
          onDone={() => setToastMode(null)}
        />
      )}
    </>
  );
}
