import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  fetchMyActivities,
  updateActivity,
  CATEGORY_CONFIG,
  type Activity,
  type CreateActivityData,
} from "../services/activityService";
import ImageUploader from "../components/ImageUploader";
import MapPicker from "../components/MapPicker";
import { API_BASE, BACKEND_URL } from "../utils/backend";

const allCategories = Object.keys(CATEGORY_CONFIG) as Array<
  keyof typeof CATEGORY_CONFIG
>;

// ─── Types ───────────────────────────────────────────────────────────────────
interface Tourist {
  id: number;
  fullName: string;
  email: string;
  image?: string;
}

interface HousingReservation {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "COMPLETED";
  startDate: string;
  endDate: string;
  tourist: Tourist;
  housingId: string;
}

interface HousingWithReservations {
  id: string;
  title: string;
  location: string;
  type: string;
  images: string[];
  pendingReservations: HousingReservation[];
  activeReservations: HousingReservation[];
}

interface ActivityReservationRequest {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "COMPLETED";
  guests: number;
  notes: string | null;
  createdAt: string;
  tourist: Tourist;
  activityId: number;
}

interface ActivityWithReservations {
  id: number;
  title: string;
  location: string;
  category: string;
  images: string[];
  price: number;
  date: string;
  pendingReservations: ActivityReservationRequest[];
  acceptedReservations: ActivityReservationRequest[];
}

// ─── API helpers ──────────────────────────────────────────────────────────────
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchMyHousings(): Promise<HousingWithReservations[]> {
  const { data } = await axios.get(`${API_BASE}/housings/view`, {
    headers: getAuthHeaders(),
  });

  const housings: any[] = Array.isArray(data)
    ? data
    : (data.housings ?? data.data ?? []);

  const withReservations = await Promise.all(
    housings.map(async (h: any) => {
      try {
        const { data: reservations } = await axios.get(
          `${API_BASE}/reservations/housing/${h.id}`,
          { headers: getAuthHeaders() },
        );

        const pending = (reservations as HousingReservation[]).filter(
          (r) => r.status === "PENDING",
        );
        const active = (reservations as HousingReservation[]).filter(
          (r) => r.status === "ACCEPTED",
        );

        return {
          ...h,
          pendingReservations: pending,
          activeReservations: active,
        };
      } catch (err: any) {
        console.error(
          `Reservations error for housing "${h.title}":`,
          err?.response?.status,
        );
        return { ...h, pendingReservations: [], activeReservations: [] };
      }
    }),
  );

  return withReservations;
}

async function updateReservationStatus(
  reservationId: string,
  status: "ACCEPTED" | "REJECTED",
): Promise<void> {
  await axios.patch(
    `${API_BASE}/reservations/${reservationId}/status`,
    { status },
    { headers: getAuthHeaders() },
  );
}

async function completeReservation(reservationId: string): Promise<void> {
  await axios.patch(
    `${API_BASE}/reservations/${reservationId}/complete`,
    {},
    { headers: getAuthHeaders() },
  );
}

async function getOrCreateConversation(targetUserId: number): Promise<string> {
  const { data: conv } = await axios.post(
    `${API_BASE}/messages/conversations`,
    { targetUserId },
    { headers: getAuthHeaders() },
  );
  return conv.id;
}

// ─── Housing Type labels ─────────────────────────────────────────────────────
const HOUSING_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Apartment",
  VILLA: "Villa",
  STUDIO: "Studio",
  TRADITIONAL_HOUSE: "Traditional House",
  FARM_STAY: "Farm Stay",
  GUESTHOUSE: "Guesthouse",
  RIAD: "Riad",
  CHALET: "Chalet",
};

// Fetch direct : une seule requête : PENDING + ACCEPTED groupés par activité
// Le backend groupe par activité et retourne pendingReservations déjà incluses
async function fetchActiveActivityReservations(): Promise<
  ActivityWithReservations[]
> {
  const { data } = await axios.get(
    `${API_BASE}/activity-reservations/active-for-creator`,
    { headers: getAuthHeaders() },
  );

  // Le backend renvoie déjà les groupes { id, title, ..., pendingReservations[] }
  // On normalise en ajoutant acceptedReservations vide pour la compatibilité de type
  const list: any[] = Array.isArray(data) ? data : [];
  return list.map((a) => ({
    ...a,
    acceptedReservations: a.acceptedReservations ?? [],
  }));
}

async function updateActivityReservationStatus(
  reservationId: string,
  status: "ACCEPTED" | "REJECTED",
): Promise<void> {
  await axios.patch(
    `${API_BASE}/activity-reservations/${reservationId}/status`,
    { status },
    { headers: getAuthHeaders() },
  );
}

async function completeActivityReservation(
  reservationId: string,
): Promise<void> {
  await axios.patch(
    `${API_BASE}/activity-reservations/${reservationId}/complete`,
    {},
    { headers: getAuthHeaders() },
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function CuratorDashboard() {
  const navigate = useNavigate();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [, setLoading] = useState(true);
  const [, setError] = useState("");

  // Edit Modal State
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editForm, setEditForm] = useState<Partial<CreateActivityData> | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  // Housing Reservations State
  const [housings, setHousings] = useState<HousingWithReservations[]>([]);
  const [housingsLoading, setHousingsLoading] = useState(true);
  const [processingReservation, setProcessingReservation] = useState<
    string | null
  >(null);
  const [completingReservation, setCompletingReservation] = useState<
    string | null
  >(null);
  const [redirectingConv, setRedirectingConv] = useState<number | null>(null);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const [activityRequests, setActivityRequests] = useState<
    ActivityWithReservations[]
  >([]);
  const [activityRequestsLoading, setActivityRequestsLoading] = useState(true);
  const [processingActivityReservation, setProcessingActivityReservation] =
    useState<string | null>(null);
  const [completingActivityReservation, setCompletingActivityReservation] =
    useState<string | null>(null);

  // ─── Role Guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (user.role && user.role !== "CITOYEN") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/auth");
    }
  }, []);

  // ─── Fetch my activities ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchMyActivities();
        setActivities(data);
      } catch (err: any) {
        if (err?.response?.status === 401 || err?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/auth");
        } else {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Failed to load activities",
          );
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ─── Fetch my housings + reservations ─────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setHousingsLoading(true);
      try {
        const data = await fetchMyHousings();
        setHousings(data);
      } catch (err: any) {
        console.error("Housings load error:", err);
      } finally {
        setHousingsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const load = async () => {
      setActivityRequestsLoading(true);
      try {
        const data = await fetchActiveActivityReservations();
        setActivityRequests(data);
      } catch (err) {
        console.error("Activity requests load error:", err);
      } finally {
        setActivityRequestsLoading(false);
      }
    };
    load();
  }, []);

  // ─── Activity Handlers ────────────────────────────────────────────────────
  const closeEditModal = () => {
    setEditingActivity(null);
    setEditForm(null);
  };

  const handleEditChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    if (!editForm) return;
    const { name, value, type } = e.target;
    setEditForm((prev) => ({
      ...prev!,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity || !editForm) return;
    setIsSaving(true);
    try {
      const payload = {
        ...editForm,
        date: new Date(editForm.date!).toISOString(),
      };
      await updateActivity(editingActivity.id, payload);
      setActivities((prev) =>
        prev.map((act) =>
          act.id === editingActivity.id
            ? ({ ...act, ...payload, date: payload.date } as Activity)
            : act,
        ),
      );
      closeEditModal();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update activity");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Housing Reservation Handlers ─────────────────────────────────────────
  const handleReservationStatus = async (
    reservationId: string,
    housingId: string,
    status: "ACCEPTED" | "REJECTED",
  ) => {
    setProcessingReservation(reservationId);
    try {
      await updateReservationStatus(reservationId, status);
      setHousings((prev) =>
        prev.map((h) => {
          if (h.id !== housingId) return h;
          const reservation = h.pendingReservations.find(
            (r) => r.id === reservationId,
          );
          return {
            ...h,
            pendingReservations: h.pendingReservations.filter(
              (r) => r.id !== reservationId,
            ),
            activeReservations:
              status === "ACCEPTED" && reservation
                ? [
                    ...h.activeReservations,
                    { ...reservation, status: "ACCEPTED" as const },
                  ]
                : h.activeReservations,
          };
        }),
      );
    } catch (err: any) {
      alert(err?.message || "Failed to update reservation");
    } finally {
      setProcessingReservation(null);
    }
  };

  const handleCompleteReservation = async (
    reservationId: string,
    housingId: string,
  ) => {
    setCompletingReservation(reservationId);
    try {
      await completeReservation(reservationId);
      setHousings((prev) =>
        prev.map((h) =>
          h.id === housingId
            ? {
                ...h,
                activeReservations: h.activeReservations.filter(
                  (r) => r.id !== reservationId,
                ),
              }
            : h,
        ),
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to mark stay as complete");
    } finally {
      setCompletingReservation(null);
    }
  };

  // ─── Activity Reservation Handlers ────────────────────────────────────────
  const handleActivityReservationStatus = async (
    reservationId: string,
    activityId: number,
    status: "ACCEPTED" | "REJECTED",
  ) => {
    setProcessingActivityReservation(reservationId);
    try {
      await updateActivityReservationStatus(reservationId, status);
      setActivityRequests((prev) =>
        prev
          .map((a) => {
            if (a.id !== activityId) return a;
            const reservation = a.pendingReservations.find(
              (r) => r.id === reservationId,
            );
            return {
              ...a,
              pendingReservations: a.pendingReservations.filter(
                (r) => r.id !== reservationId,
              ),
              acceptedReservations:
                status === "ACCEPTED" && reservation
                  ? [
                      ...a.acceptedReservations,
                      { ...reservation, status: "ACCEPTED" as const },
                    ]
                  : a.acceptedReservations,
            };
          })
          .filter(
            (a) =>
              a.pendingReservations.length > 0 ||
              a.acceptedReservations.length > 0,
          ),
      );
    } catch (err: any) {
      alert(err?.message || "Failed to update reservation");
    } finally {
      setProcessingActivityReservation(null);
    }
  };

  const handleCompleteActivityReservation = async (
    reservationId: string,
    activityId: number,
  ) => {
    setCompletingActivityReservation(reservationId);
    try {
      await completeActivityReservation(reservationId);
      setActivityRequests((prev) =>
        prev
          .map((a) =>
            a.id !== activityId
              ? a
              : {
                  ...a,
                  acceptedReservations: a.acceptedReservations.filter(
                    (r) => r.id !== reservationId,
                  ),
                },
          )
          .filter(
            (a) =>
              a.pendingReservations.length > 0 ||
              a.acceptedReservations.length > 0,
          ),
      );
    } catch (err: any) {
      alert(
        err?.response?.data?.message || "Failed to mark activity as complete",
      );
    } finally {
      setCompletingActivityReservation(null);
    }
  };

  const handleOpenConversation = async (touristId: number) => {
    setRedirectingConv(touristId);
    try {
      const convId = await getOrCreateConversation(touristId);
      navigate("/messaging", { state: { targetConvId: convId } });
    } catch (err: any) {
      alert(err?.message || "Failed to open conversation");
    } finally {
      setRedirectingConv(null);
    }
  };

  // ─── Stats ────────────────────────────────────────────────────────────────
  const totalActivities = activities.length;
  const approvedCount = activities.filter(
    (a) => a.status === "APPROVED",
  ).length;
  const pendingCount = activities.filter((a) => a.status === "PENDING").length;

  const totalPendingReservations = housings.reduce(
    (sum, h) => sum + h.pendingReservations.length,
    0,
  );
  const totalActiveStays = housings.reduce(
    (sum, h) => sum + h.activeReservations.length,
    0,
  );

  const housingsWithPending = housings.filter(
    (h) => h.pendingReservations.length > 0,
  );
  const housingsWithActive = housings.filter(
    (h) => h.activeReservations.length > 0,
  );

  const totalPendingActivityReservations = activityRequests.reduce(
    (sum, a) => sum + a.pendingReservations.length,
    0,
  );
  const totalAcceptedActivityReservations = activityRequests.reduce(
    (sum, a) => sum + a.acceptedReservations.length,
    0,
  );

  const activitiesWithPending = activityRequests.filter(
    (a) => a.pendingReservations.length > 0,
  );
  const activitiesWithAccepted = activityRequests.filter(
    (a) => a.acceptedReservations.length > 0,
  );

  return (
    <main className="max-w-7xl mx-auto px-8 py-12 pt-32 relative">
      {/* Header */}
      <header className="mb-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary/60">
                Verified Artisan Dashboard
              </span>
            </div>
            <h1 className="font-headline text-5xl font-light text-on-surface leading-tight">
              Aslema,{" "}
              <span className="font-semibold text-primary">
                {user?.fullName || "Curator"}.
              </span>
            </h1>
            <p className="text-on-surface-variant mt-4 text-base font-light leading-relaxed max-w-md">
              Your curation preserves Tunisia's mosaic. Track your impact and
              manage your unique local experiences.
            </p>
          </div>
        </div>
      </header>

      {/* Stats Activities — ligne séparée */}
      <section className="mb-6">
        <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-4">
          Activities
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="stat-card bg-surface p-6 rounded-2xl soft-shadow border border-outline-variant/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="w-10 h-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-xl">
                travel_explore
              </span>
            </div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
              Total Experiences
            </p>
            <span className="text-2xl font-semibold text-on-surface tracking-tight">
              {totalActivities}
            </span>
          </div>

          <div className="stat-card bg-surface p-6 rounded-2xl soft-shadow border border-outline-variant/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-xl">
                check_circle
              </span>
            </div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
              Approved
            </p>
            <span className="text-2xl font-semibold text-on-surface">
              {approvedCount}
            </span>
          </div>

          <div className="stat-card bg-surface p-6 rounded-2xl soft-shadow border border-outline-variant/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-xl">
                hourglass_top
              </span>
            </div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
              Pending
            </p>
            <span className="text-2xl font-semibold text-on-surface">
              {pendingCount}
            </span>
          </div>
        </div>
      </section>

      {/* Stats Housing — ligne séparée */}
      <section className="mb-6">
        <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-4">
          Housing
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="stat-card bg-surface p-6 rounded-2xl soft-shadow border border-outline-variant/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-xl">
                home_work
              </span>
            </div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
              Total Properties
            </p>
            <span className="text-2xl font-semibold text-on-surface tracking-tight">
              {housings.length}
            </span>
          </div>

          <div className="stat-card bg-surface p-6 rounded-2xl soft-shadow border border-outline-variant/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-xl">hotel</span>
            </div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
              Active Stays
            </p>
            <span className="text-2xl font-semibold text-on-surface">
              {totalActiveStays}
            </span>
          </div>

          <div className="stat-card bg-surface p-6 rounded-2xl soft-shadow border border-outline-variant/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-xl">
                pending_actions
              </span>
            </div>
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
              Pending Requests
            </p>
            <span className="text-2xl font-semibold text-on-surface">
              {totalPendingReservations}
            </span>
          </div>
        </div>
      </section>

      {/* ── Activity Requests — Pending ─────────────────────────────────────── */}
      <section className="mb-20">
        <div className="flex items-baseline justify-between mb-10">
          <div>
            <h2 className="font-headline text-3xl font-light text-on-surface">
              Activity{" "}
              <span className="font-semibold text-primary tracking-tight">
                Requests
              </span>
            </h2>
            <p className="text-on-surface-variant text-sm font-light mt-1">
              Pending booking requests from travellers for your activities
            </p>
          </div>
          {totalPendingActivityReservations > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold tracking-wide border border-violet-200">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              {totalPendingActivityReservations} pending
            </span>
          )}
        </div>

        {activityRequestsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-surface rounded-2xl p-6 border border-outline-variant/20"
              >
                <div className="h-4 bg-surface-container-high rounded w-1/2 mb-4" />
                <div className="space-y-3">
                  <div className="h-16 bg-surface-container-high rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!activityRequestsLoading && activitiesWithPending.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-outline-variant/40 bg-surface/50">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-3">
              event_available
            </span>
            <p className="text-on-surface-variant text-sm font-medium">
              No pending activity booking requests right now
            </p>
            <p className="text-on-surface-variant/60 text-xs mt-1">
              New requests will appear here
            </p>
          </div>
        )}

        {!activityRequestsLoading && activitiesWithPending.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activitiesWithPending.map((activity) => {
              const catConfig =
                CATEGORY_CONFIG[
                  activity.category as keyof typeof CATEGORY_CONFIG
                ];
              return (
                <div
                  key={activity.id}
                  className="bg-surface rounded-2xl border border-outline-variant/20 soft-shadow overflow-hidden"
                >
                  {/* Activity header — same format as housing cards */}
                  <div className="flex items-center gap-4 px-5 py-4 border-b border-outline-variant/10 bg-surface-container-low/50">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-surface-container-high">
                      {activity.images?.[0] ? (
                        <img
                          src={activity.images[0]}
                          alt={activity.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-surface-variant/40">
                            {catConfig?.icon || "event"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-on-surface text-sm truncate">
                        {activity.title}
                      </h3>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5 flex-wrap">
                        <span className="material-symbols-outlined text-[12px] text-primary/50">
                          location_on
                        </span>
                        {activity.location}
                        <span className="text-outline mx-1">·</span>
                        <span className="text-outline">
                          {catConfig?.label || activity.category}
                        </span>
                      </p>
                    </div>
                    <span className="ml-auto shrink-0 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                      {activity.pendingReservations.length} request
                      {activity.pendingReservations.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Pending reservations — same format as housing reservation rows */}
                  <div className="divide-y divide-outline-variant/10">
                    {activity.pendingReservations.map((reservation) => {
                      const isProcessing =
                        processingActivityReservation === reservation.id;
                      const isRedirecting =
                        redirectingConv === reservation.tourist.id;

                      return (
                        <div
                          key={reservation.id}
                          className="flex items-center gap-4 px-5 py-4"
                        >
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden bg-surface-container-high flex items-center justify-center">
                            {reservation.tourist.image ? (
                              <img
                                src={
                                  reservation.tourist.image.startsWith("http")
                                    ? reservation.tourist.image
                                    : `${BACKEND_URL}${reservation.tourist.image}`
                                }
                                alt={reservation.tourist.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="material-symbols-outlined text-[18px] text-on-surface-variant/50">
                                person
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-on-surface truncate">
                              {reservation.tourist.fullName}
                            </p>
                            <p className="text-[11px] text-on-surface-variant truncate">
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[11px]">
                                  group
                                </span>
                                {reservation.guests} participant
                                {reservation.guests > 1 ? "s" : ""}
                                <span className="text-outline mx-1">·</span>
                                <span className="font-medium text-primary">
                                  {(
                                    activity.price * reservation.guests
                                  ).toFixed(2)}{" "}
                                  TND
                                </span>
                              </span>
                            </p>
                          </div>

                          {/* Actions — identical to housing request buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() =>
                                handleOpenConversation(reservation.tourist.id)
                              }
                              disabled={isRedirecting || isProcessing}
                              title="Message requester"
                              className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors disabled:opacity-40"
                            >
                              {isRedirecting ? (
                                <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <span className="material-symbols-outlined text-[16px]">
                                  chat
                                </span>
                              )}
                            </button>

                            <button
                              onClick={() =>
                                handleActivityReservationStatus(
                                  reservation.id,
                                  activity.id,
                                  "REJECTED",
                                )
                              }
                              disabled={isProcessing}
                              title="Reject request"
                              className="w-8 h-8 rounded-full border border-red-200 bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors disabled:opacity-40"
                            >
                              {isProcessing ? (
                                <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <span className="material-symbols-outlined text-[16px]">
                                  close
                                </span>
                              )}
                            </button>

                            <button
                              onClick={() =>
                                handleActivityReservationStatus(
                                  reservation.id,
                                  activity.id,
                                  "ACCEPTED",
                                )
                              }
                              disabled={isProcessing}
                              title="Confirm request"
                              className="w-8 h-8 rounded-full border border-green-200 bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors disabled:opacity-40"
                            >
                              {isProcessing ? (
                                <span className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <span className="material-symbols-outlined text-[16px]">
                                  check
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Active Activity Participants ─────────────────────────────────────── */}
      {(activityRequestsLoading || activitiesWithAccepted.length > 0) && (
        <section className="mb-20">
          <div className="flex items-baseline justify-between mb-10">
            <div>
              <h2 className="font-headline text-3xl font-light text-on-surface">
                Confirmed{" "}
                <span className="font-semibold text-violet-600 tracking-tight">
                  Participants
                </span>
              </h2>
              <p className="text-on-surface-variant text-sm font-light mt-1">
                Accepted bookings for your upcoming activities — mark as
                complete after the event
              </p>
            </div>
            {totalAcceptedActivityReservations > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-bold tracking-wide border border-violet-200">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                {totalAcceptedActivityReservations} confirmed
              </span>
            )}
          </div>

          {activityRequestsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-surface rounded-2xl p-6 border border-outline-variant/20"
                >
                  <div className="h-4 bg-surface-container-high rounded w-1/2 mb-4" />
                  <div className="h-16 bg-surface-container-high rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {!activityRequestsLoading && activitiesWithAccepted.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activitiesWithAccepted.map((activity) => {
                const catConfig =
                  CATEGORY_CONFIG[
                    activity.category as keyof typeof CATEGORY_CONFIG
                  ];
                return (
                  <div
                    key={activity.id}
                    className="bg-surface rounded-2xl border border-violet-100 soft-shadow overflow-hidden ring-1 ring-violet-200/60"
                  >
                    {/* Activity header */}
                    <div className="flex items-center gap-4 px-5 py-4 border-b border-violet-100 bg-violet-50/40">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-surface-container-high">
                        {activity.images?.[0] ? (
                          <img
                            src={activity.images[0]}
                            alt={activity.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-surface-variant/40">
                              {catConfig?.icon || "event"}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-on-surface text-sm truncate">
                          {activity.title}
                        </h3>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5 flex-wrap">
                          <span className="material-symbols-outlined text-[12px] text-violet-400">
                            location_on
                          </span>
                          {activity.location}
                          <span className="text-outline mx-1">·</span>
                          <span className="text-outline">
                            {catConfig?.label || activity.category}
                          </span>
                        </p>
                      </div>
                      <span className="ml-auto shrink-0 flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                        {activity.acceptedReservations.length} confirmed
                      </span>
                    </div>

                    {/* Accepted reservations */}
                    <div className="divide-y divide-outline-variant/10">
                      {activity.acceptedReservations.map((reservation) => {
                        const isCompleting =
                          completingActivityReservation === reservation.id;
                        const isRedirecting =
                          redirectingConv === reservation.tourist.id;

                        return (
                          <div key={reservation.id} className="px-5 py-4">
                            <div className="flex items-center gap-4 mb-3">
                              {/* Avatar */}
                              <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden bg-surface-container-high flex items-center justify-center">
                                {reservation.tourist.image ? (
                                  <img
                                    src={
                                      reservation.tourist.image.startsWith(
                                        "http",
                                      )
                                        ? reservation.tourist.image
                                        : `${BACKEND_URL}${reservation.tourist.image}`
                                    }
                                    alt={reservation.tourist.fullName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant/50">
                                    person
                                  </span>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-on-surface truncate">
                                  {reservation.tourist.fullName}
                                </p>
                                <p className="text-[11px] text-on-surface-variant flex items-center gap-2 flex-wrap">
                                  <span className="flex items-center gap-0.5">
                                    <span className="material-symbols-outlined text-[11px]">
                                      group
                                    </span>
                                    {reservation.guests} participant
                                    {reservation.guests > 1 ? "s" : ""}
                                  </span>
                                  <span className="text-outline">·</span>
                                  <span className="font-medium text-violet-600">
                                    {(
                                      activity.price * reservation.guests
                                    ).toFixed(2)}{" "}
                                    TND
                                  </span>
                                </p>
                              </div>

                              {/* Chat button */}
                              <button
                                onClick={() =>
                                  handleOpenConversation(reservation.tourist.id)
                                }
                                disabled={isRedirecting || isCompleting}
                                title="Message participant"
                                className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors disabled:opacity-40"
                              >
                                {isRedirecting ? (
                                  <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <span className="material-symbols-outlined text-[16px]">
                                    chat
                                  </span>
                                )}
                              </button>
                            </div>

                            {/* Notes */}
                            {reservation.notes && (
                              <p className="mb-3 text-[11px] text-on-surface-variant italic bg-surface-container-low px-3 py-2 rounded-lg border border-outline-variant/20 line-clamp-2">
                                "{reservation.notes}"
                              </p>
                            )}

                            {/* Mark Complete CTA */}
                            <button
                              onClick={() =>
                                handleCompleteActivityReservation(
                                  reservation.id,
                                  activity.id,
                                )
                              }
                              disabled={isCompleting}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider transition-all"
                            >
                              {isCompleting ? (
                                <>
                                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  Marking as complete…
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-base">
                                    check_circle
                                  </span>
                                  Mark Activity as Complete
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── Active Stays Section ─────────────────────────────────────────────── */}
      {(housingsLoading || housingsWithActive.length > 0) && (
        <section className="mb-20">
          <div className="flex items-baseline justify-between mb-10">
            <div>
              <h2 className="font-headline text-3xl font-light text-on-surface">
                Active{" "}
                <span className="font-semibold text-rose-600 tracking-tight">
                  Stays
                </span>
              </h2>
              <p className="text-on-surface-variant text-sm font-light mt-1">
                Tourists currently staying at your properties — mark as complete
                when they leave
              </p>
            </div>
            {totalActiveStays > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold tracking-wide border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                {totalActiveStays} active
              </span>
            )}
          </div>

          {housingsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-surface rounded-2xl p-6 border border-outline-variant/20"
                >
                  <div className="h-4 bg-surface-container-high rounded w-1/2 mb-4" />
                  <div className="h-16 bg-surface-container-high rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {!housingsLoading && housingsWithActive.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {housingsWithActive.map((housing) => (
                <div
                  key={housing.id}
                  className="bg-surface rounded-2xl border border-rose-100 soft-shadow overflow-hidden ring-1 ring-rose-200/60"
                >
                  <div className="flex items-center gap-4 px-5 py-4 border-b border-rose-100 bg-rose-50/40">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-surface-container-high">
                      {housing.images?.[0] ? (
                        <img
                          src={housing.images[0]}
                          alt={housing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-surface-variant/40">
                            home
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-on-surface text-sm truncate">
                        {housing.title}
                      </h3>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[12px] text-rose-500">
                          location_on
                        </span>
                        {housing.location}
                        <span className="text-outline mx-1">·</span>
                        <span className="text-outline">
                          {HOUSING_TYPE_LABELS[housing.type] || housing.type}
                        </span>
                      </p>
                    </div>
                    <span className="ml-auto shrink-0 flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      Occupied
                    </span>
                  </div>

                  <div className="divide-y divide-outline-variant/10">
                    {housing.activeReservations.map((reservation) => {
                      const isCompleting =
                        completingReservation === reservation.id;
                      const isRedirecting =
                        redirectingConv === reservation.tourist.id;

                      return (
                        <div key={reservation.id} className="px-5 py-4">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden bg-surface-container-high flex items-center justify-center">
                              {reservation.tourist.image ? (
                                <img
                                  src={reservation.tourist.image}
                                  alt={reservation.tourist.fullName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-[18px] text-on-surface-variant/50">
                                  person
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-on-surface truncate">
                                {reservation.tourist.fullName}
                              </p>
                              <p className="text-[11px] text-on-surface-variant">
                                {new Date(
                                  reservation.startDate,
                                ).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                })}{" "}
                                →{" "}
                                {new Date(
                                  reservation.endDate,
                                ).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                handleOpenConversation(reservation.tourist.id)
                              }
                              disabled={isRedirecting || isCompleting}
                              title="Message tourist"
                              className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors disabled:opacity-40"
                            >
                              {isRedirecting ? (
                                <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <span className="material-symbols-outlined text-[16px]">
                                  chat
                                </span>
                              )}
                            </button>
                          </div>

                          <button
                            onClick={() =>
                              handleCompleteReservation(
                                reservation.id,
                                housing.id,
                              )
                            }
                            disabled={isCompleting}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider transition-all"
                          >
                            {isCompleting ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Marking as complete…
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-base">
                                  check_circle
                                </span>
                                Mark Stay as Complete
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Housing Requests Section ─────────────────────────────────────────── */}
      <section className="mb-20">
        <div className="flex items-baseline justify-between mb-10">
          <div>
            <h2 className="font-headline text-3xl font-light text-on-surface">
              Housing{" "}
              <span className="font-semibold text-primary tracking-tight">
                Requests
              </span>
            </h2>
            <p className="text-on-surface-variant text-sm font-light mt-1">
              Pending reservation requests from travellers for your properties
            </p>
          </div>
          {totalPendingReservations > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold tracking-wide border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {totalPendingReservations} pending
            </span>
          )}
        </div>

        {housingsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-surface rounded-2xl p-6 border border-outline-variant/20"
              >
                <div className="h-4 bg-surface-container-high rounded w-1/2 mb-4" />
                <div className="space-y-3">
                  <div className="h-16 bg-surface-container-high rounded-xl" />
                  <div className="h-16 bg-surface-container-high rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!housingsLoading && housingsWithPending.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-outline-variant/40 bg-surface/50">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-3">
              home_work
            </span>
            <p className="text-on-surface-variant text-sm font-medium">
              No pending reservation requests right now
            </p>
            <p className="text-on-surface-variant/60 text-xs mt-1">
              New requests will appear here
            </p>
          </div>
        )}

        {!housingsLoading && housingsWithPending.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {housingsWithPending.map((housing) => (
              <div
                key={housing.id}
                className="bg-surface rounded-2xl border border-outline-variant/20 soft-shadow overflow-hidden"
              >
                <div className="flex items-center gap-4 px-5 py-4 border-b border-outline-variant/10 bg-surface-container-low/50">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-surface-container-high">
                    {housing.images?.[0] ? (
                      <img
                        src={housing.images[0]}
                        alt={housing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant/40">
                          home
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-on-surface text-sm truncate">
                      {housing.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[12px] text-primary/50">
                        location_on
                      </span>
                      {housing.location}
                      <span className="text-outline mx-1">·</span>
                      <span className="text-outline">
                        {HOUSING_TYPE_LABELS[housing.type] || housing.type}
                      </span>
                    </p>
                  </div>
                  <span className="ml-auto shrink-0 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                    {housing.pendingReservations.length} request
                    {housing.pendingReservations.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="divide-y divide-outline-variant/10">
                  {housing.pendingReservations.map((reservation) => {
                    const isProcessing =
                      processingReservation === reservation.id;
                    const isRedirecting =
                      redirectingConv === reservation.tourist.id;

                    return (
                      <div
                        key={reservation.id}
                        className="flex items-center gap-4 px-5 py-4"
                      >
                        <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden bg-surface-container-high flex items-center justify-center">
                          {reservation.tourist.image ? (
                            <img
                              src={reservation.tourist.image}
                              alt={reservation.tourist.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant/50">
                              person
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">
                            {reservation.tourist.fullName}
                          </p>
                          <p className="text-[11px] text-on-surface-variant truncate">
                            {new Date(reservation.startDate).toLocaleDateString(
                              "en-GB",
                              { day: "numeric", month: "short" },
                            )}{" "}
                            →{" "}
                            {new Date(reservation.endDate).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() =>
                              handleOpenConversation(reservation.tourist.id)
                            }
                            disabled={isRedirecting || isProcessing}
                            title="Message requester"
                            className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors disabled:opacity-40"
                          >
                            {isRedirecting ? (
                              <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-[16px]">
                                chat
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() =>
                              handleReservationStatus(
                                reservation.id,
                                housing.id,
                                "REJECTED",
                              )
                            }
                            disabled={isProcessing}
                            title="Deny request"
                            className="w-8 h-8 rounded-full border border-red-200 bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors disabled:opacity-40"
                          >
                            {isProcessing ? (
                              <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-[16px]">
                                close
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() =>
                              handleReservationStatus(
                                reservation.id,
                                housing.id,
                                "ACCEPTED",
                              )
                            }
                            disabled={isProcessing}
                            title="Accept request"
                            className="w-8 h-8 rounded-full border border-green-200 bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors disabled:opacity-40"
                          >
                            {isProcessing ? (
                              <span className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-[16px]">
                                check
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Edit Modal ───────────────────────────────────────────────────────── */}
      {editingActivity && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low shrink-0">
              <h2 className="font-headline text-2xl text-primary font-bold">
                Edit Experience
              </h2>
              <button
                onClick={closeEditModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto p-6"
              style={{ scrollbarWidth: "thin" }}
            >
              <form
                id="edit-activity-form"
                onSubmit={handleSaveEdit}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/70">
                    Title
                  </label>
                  <input
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    required
                    className="w-full bg-surface-container-low border-none rounded-xl p-3 focus:ring-2 focus:ring-primary text-on-surface"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/70">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditChange}
                    required
                    rows={4}
                    className="w-full bg-surface-container-low border-none rounded-xl p-3 focus:ring-2 focus:ring-primary text-on-surface"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-primary/70">
                      Category
                    </label>
                    <select
                      name="category"
                      value={editForm.category}
                      onChange={handleEditChange}
                      className="w-full bg-surface-container-low border-none rounded-xl p-3 focus:ring-2 focus:ring-primary text-on-surface"
                    >
                      {allCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_CONFIG[cat].label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-primary/70">
                      Capacity
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={editForm.capacity}
                      onChange={handleEditChange}
                      min="1"
                      required
                      className="w-full bg-surface-container-low border-none rounded-xl p-3 focus:ring-2 focus:ring-primary text-on-surface"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-primary/70">
                      Price (TND)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={editForm.price}
                      onChange={handleEditChange}
                      min="1"
                      step="0.1"
                      required
                      className="w-full bg-surface-container-low border-none rounded-xl p-3 focus:ring-2 focus:ring-primary text-on-surface"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-primary/70">
                      Date
                    </label>
                    <input
                      type="datetime-local"
                      name="date"
                      value={editForm.date}
                      onChange={handleEditChange}
                      required
                      className="w-full bg-surface-container-low border-none rounded-xl p-3 focus:ring-2 focus:ring-primary text-on-surface font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/70">
                    Images
                  </label>
                  <ImageUploader
                    images={editForm.images || []}
                    onImagesChange={(urls) =>
                      setEditForm((prev) => ({ ...prev!, images: urls }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest text-primary/70">
                      Location
                    </label>
                    <p className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        location_on
                      </span>{" "}
                      {editForm.location}
                    </p>
                  </div>
                  <input
                    name="location"
                    value={editForm.location}
                    onChange={handleEditChange}
                    required
                    placeholder="E.g. Tunis Medina"
                    className="w-full bg-surface-container-low border-none rounded-xl p-3 mb-2 focus:ring-2 focus:ring-primary text-on-surface"
                  />
                  <MapPicker
                    latitude={editForm.latitude || 36.8}
                    longitude={editForm.longitude || 10.18}
                    onLocationChange={(lat, lng) =>
                      setEditForm((prev) => ({
                        ...prev!,
                        latitude: lat,
                        longitude: lng,
                      }))
                    }
                    height="250px"
                  />
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface-container-lowest shrink-0">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-6 py-2.5 rounded-full font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-activity-form"
                disabled={isSaving}
                className="px-8 py-2.5 rounded-full bg-primary text-white font-bold tracking-wide shadow-md hover:shadow-lg hover:bg-primary-container hover:text-on-primary-container transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">
                      save
                    </span>{" "}
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decorative shapes */}
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 -left-24 w-64 h-64 bg-secondary/5 rounded-full blur-[80px] pointer-events-none -z-10" />
    </main>
  );
}
