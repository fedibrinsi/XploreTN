import { z } from "zod";

// ─── Category enum values (must match Prisma ActivityCategory) ──────────────
const ActivityCategoryEnum = z.enum([
  "ART_HERITAGE",
  "GASTRONOMY",
  "COASTAL_ESCAPE",
  "HISTORICAL_TOUR",
  "ARTISAN_WORKSHOP",
  "DESERT_EXPEDITION",
  "NATURE_ADVENTURE",
  "CULTURAL_EVENT",
  "WELLNESS",
  "OTHER",
]);

// ─── Create Activity Schema ─────────────────────────────────────────────────
export const createActivitySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().positive("Price must be greater than 0"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  location: z.string().min(1, "Location is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  images: z.array(z.string().url()).default([]),
  capacity: z.number().int().positive("Capacity must be at least 1"),
  category: ActivityCategoryEnum,
});

// ─── Update Activity Schema (all fields optional) ───────────────────────────
export const updateActivitySchema = createActivitySchema.partial();

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
