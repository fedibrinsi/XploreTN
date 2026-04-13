import api from "./api";

// ─── Types ──────────────────────────────────────────────────────────────────
export type ActivityCategory =
  | "ART_HERITAGE"
  | "GASTRONOMY"
  | "COASTAL_ESCAPE"
  | "HISTORICAL_TOUR"
  | "ARTISAN_WORKSHOP"
  | "DESERT_EXPEDITION"
  | "NATURE_ADVENTURE"
  | "CULTURAL_EVENT"
  | "WELLNESS"
  | "OTHER";

export type ActivityStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Activity {
  id: number;
  title: string;
  description: string;
  price: number;
  date: string;
  location: string;
  latitude: number;
  longitude: number;
  images: string[];
  status: ActivityStatus;
  capacity: number;
  category: ActivityCategory;
  createdAt: string;
  updatedAt: string;
  creatorId: number;
  creator: {
    id: number;
    fullName: string;
    image: string;
    bio?: string;
  };
}

export interface ActivityFilters {
  category?: ActivityCategory;
  status?: ActivityStatus;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateActivityData {
  title: string;
  description: string;
  price: number;
  date: string;
  location: string;
  latitude: number;
  longitude: number;
  images: string[];
  capacity: number;
  category: ActivityCategory;
}

// ─── Category display config (label + Material Symbol icon) ─────────────────
export const CATEGORY_CONFIG: Record<
  ActivityCategory,
  { label: string; icon: string }
> = {
  ART_HERITAGE: { label: "Art & Heritage", icon: "palette" },
  GASTRONOMY: { label: "Gastronomy", icon: "restaurant" },
  COASTAL_ESCAPE: { label: "Coastal Escape", icon: "sailing" },
  HISTORICAL_TOUR: { label: "Historical Tour", icon: "account_balance" },
  ARTISAN_WORKSHOP: { label: "Artisan Workshop", icon: "construction" },
  DESERT_EXPEDITION: { label: "Desert Expedition", icon: "landscape" },
  NATURE_ADVENTURE: { label: "Nature & Adventure", icon: "forest" },
  CULTURAL_EVENT: { label: "Cultural Event", icon: "theater_comedy" },
  WELLNESS: { label: "Wellness", icon: "spa" },
  OTHER: { label: "Other", icon: "category" },
};

// ─── API Calls ──────────────────────────────────────────────────────────────

export async function fetchActivities(filters: ActivityFilters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.status) params.set("status", filters.status);
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));

  const res = await api.get(`/activities?${params.toString()}`);
  return res.data as {
    activities: Activity[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export async function fetchActivityById(id: number | string) {
  const res = await api.get(`/activities/${id}`);
  return res.data.activity as Activity;
}

export async function fetchMyActivities() {
  const res = await api.get("/activities/my");
  return res.data.activities as Activity[];
}

export async function createActivity(data: CreateActivityData) {
  const res = await api.post("/activities", data);
  return res.data;
}

export async function updateActivity(id: number, data: Partial<CreateActivityData>) {
  const res = await api.put(`/activities/${id}`, data);
  return res.data;
}

export async function deleteActivity(id: number) {
  const res = await api.delete(`/activities/${id}`);
  return res.data;
}
