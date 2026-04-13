import prisma from "../prisma.js";
import type { ActivityCategory, ActivityStatus } from "../../generated/prisma/client.js";
import type { CreateActivityInput, UpdateActivityInput } from "../validators/activity.validator.js";

// ─── Filters interface ──────────────────────────────────────────────────────
interface ActivityFilters {
  category?: ActivityCategory;
  status?: ActivityStatus;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ─── Create a new activity ──────────────────────────────────────────────────
export async function createActivity(data: CreateActivityInput, creatorId: number) {
  const activity = await prisma.activity.create({
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      date: new Date(data.date),
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      images: data.images,
      capacity: data.capacity,
      category: data.category,
      creatorId,
      // status defaults to APPROVED (set in schema)
    },
    include: {
      creator: {
        select: { id: true, fullName: true, image: true },
      },
    },
  });

  return activity;
}

// ─── List activities with optional filters ──────────────────────────────────
export async function getActivities(filters: ActivityFilters = {}) {
  const {
    category,
    status,
    minPrice,
    maxPrice,
    search,
    page = 1,
    pageSize = 12,
  } = filters;

  const where: any = {};

  if (category) where.category = category;
  if (status) where.status = status;
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: {
        creator: {
          select: { id: true, fullName: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.activity.count({ where }),
  ]);

  return { activities, total, page, pageSize };
}

// ─── Get a single activity by ID ────────────────────────────────────────────
export async function getActivityById(id: number) {
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      creator: {
        select: { id: true, fullName: true, image: true, bio: true },
      },
    },
  });

  return activity;
}

// ─── Get activities created by a specific user ──────────────────────────────
export async function getMyActivities(userId: number) {
  const activities = await prisma.activity.findMany({
    where: { creatorId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      creator: {
        select: { id: true, fullName: true, image: true },
      },
    },
  });

  return activities;
}

// ─── Update an activity (with ownership check) ─────────────────────────────
export async function updateActivity(id: number, data: UpdateActivityInput, userId: number) {
  // Check existence and ownership
  const existing = await prisma.activity.findUnique({ where: { id } });
  if (!existing) return { error: "NOT_FOUND" as const };
  if (existing.creatorId !== userId) return { error: "FORBIDDEN" as const };

  const updated = await prisma.activity.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.date && { date: new Date(data.date) }),
      ...(data.location && { location: data.location }),
      ...(data.latitude !== undefined && { latitude: data.latitude }),
      ...(data.longitude !== undefined && { longitude: data.longitude }),
      ...(data.images && { images: data.images }),
      ...(data.capacity !== undefined && { capacity: data.capacity }),
      ...(data.category && { category: data.category }),
    },
    include: {
      creator: {
        select: { id: true, fullName: true, image: true },
      },
    },
  });

  return { activity: updated };
}

// ─── Delete an activity (with ownership check) ─────────────────────────────
export async function deleteActivity(id: number, userId: number) {
  const existing = await prisma.activity.findUnique({ where: { id } });
  if (!existing) return { error: "NOT_FOUND" as const };
  if (existing.creatorId !== userId) return { error: "FORBIDDEN" as const };

  await prisma.activity.delete({ where: { id } });
  return { success: true };
}
