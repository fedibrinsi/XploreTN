import { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import {
  createActivitySchema,
  updateActivitySchema,
} from "../validators/activity.validator.js";
import * as activityService from "../services/activity.service.js";
import type {
  ActivityCategory,
  ActivityStatus,
} from "../../generated/prisma/client.js";
import { Prisma } from "../../generated/prisma/client.js";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * Activity Controller
 * ════════════════════════════════════════════════════════════════════════════
 *
 * This controller integrates with the service layer for database operations
 * while maintaining validation and error handling at the HTTP boundary.
 *
 * Pattern: HTTP Request → Validation → Service Layer → Response
 *          (Middleware can hook into res.locals for side effects like embedding)
 *
 * ⚠️  BREAKING POINTS:
 *   1. Response format change (see individual endpoints)
 *   2. Authentication property: req.user?.userId (not req.user.id)
 *   3. Prisma instance is shared singleton from prisma.ts
 *   4. Middleware expectations (res.locals pattern used for AI embedding)
 * ════════════════════════════════════════════════════════════════════════════
 */

// ── Type definitions ──────────────────────────────────────────────────────────
/** Fields allowed in an Activity create request */
type CreateActivityBody = {
  title: string;
  description: string;
  price: number;
  date: string; // ISO string from JSON
  location: string;
  latitude: number;
  longitude: number;
  images?: string[];
  capacity: number;
  category: string;
  tags?: string[];
};

/** Partial version for updates */
type UpdateActivityBody = Partial<CreateActivityBody>;

// ── Error handling ────────────────────────────────────────────────────────────
/**
 * Converts Prisma errors to HTTP responses.
 * Handles both expected database errors and unexpected failures.
 *
 * Prisma error codes:
 *   P2002 - Unique constraint violation
 *   P2025 - Record not found
 */
function handlePrismaError(err: unknown, res: Response, context: string): void {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        // Unique constraint violation
        res.status(409).json({
          message: `${context}: a record with those values already exists`,
        });
        return;
      case "P2025":
        // Record not found
        res.status(404).json({ message: `${context}: record not found` });
        return;
      default:
        res.status(400).json({
          message: `${context}: database error (${err.code})`,
        });
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ message: `${context}: invalid data` });
    return;
  }

  console.error(`[activity.controller] ${context}:`, err);
  res.status(500).json({ message: "Internal server error" });
}

/**
 * ─── POST /api/activities ────────────────────────────────────────────────
 * Create a new activity
 *
 * ⚠️  BREAKING CHANGE: This endpoint now populates res.locals for middleware.
 *     Middleware (e.g., AI embedding) can read res.locals.activity to process
 *     the created entity. The middleware should call next() or send the response.
 *     If no middleware is attached, you must call next() explicitly or define
 *     a respond middleware to send the response.
 *
 * Request body:
 *   - title: string (required)
 *   - description: string (required)
 *   - price: number (required)
 *   - date: string ISO date (required)
 *   - location: string (required)
 *   - latitude: number (required)
 *   - longitude: number (required)
 *   - capacity: number (required)
 *   - category: string (required)
 *   - images?: string[] (optional)
 *   - tags?: string[] (optional)
 *
 * Response: 201 Created
 *   { message: "Activity created successfully", activity: {...} }
 *
 * Errors:
 *   - 400: Validation failed
 *   - 401: Authentication required
 *   - 409: Unique constraint violation
 *   - 500: Internal server error
 */
export async function create(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // ── Ensure authentication ────────────────────────────────────────────────
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // ── Validate input ───────────────────────────────────────────────────────
    const parsed = createActivitySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    // ── Create activity ─────────────────────────────────────────────────────
    const activity = await activityService.createActivity(
      parsed.data,
      req.user.userId, // ✅ Use userId from auth middleware
    );

    // ── Store in res.locals for middleware (e.g., AI embedding) ─────────────
    // Middleware downstream can read res.locals and trigger side effects
    // (e.g., embedding the activity for AI search)
    res.locals.activity = activity;
    res.locals.statusCode = 201;
    res.locals.message = "Activity created successfully";

    // ── Call next() to allow middleware to process ──────────────────────────
    // If no middleware is attached, the response will not be sent!
    // Ensure you have a respond middleware or call res.json() here
    return next();
  } catch (err) {
    handlePrismaError(err, res, "createActivity");
  }
}

/**
 * ─── GET /api/activities ────────────────────────────────────────────────
 * List all activities with optional filters and pagination
 *
 * Query parameters:
 *   - category?: ActivityCategory (enum: SPORTS, CULTURAL, etc.)
 *   - status?: ActivityStatus (enum: APPROVED, PENDING, etc.)
 *   - minPrice?: number
 *   - maxPrice?: number
 *   - search?: string (searches title, description, location)
 *   - page?: number (default: 1)
 *   - pageSize?: number (default: 12)
 *
 * Response: 200 OK
 *   { activities: [...], total: number, page: number, pageSize: number }
 *
 * Errors:
 *   - 500: Internal server error
 */
export async function list(req: Request, res: Response): Promise<void> {
  try {
    const {
      category,
      status,
      minPrice,
      maxPrice,
      search,
      page,
      pageSize,
      sortBy,
    } = req.query;

    const result = await activityService.getActivities({
      category: category as ActivityCategory | undefined,
      status: status as ActivityStatus | undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      search: search as string | undefined,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 12,
      sortBy: sortBy as "newest" | "price_asc" | "price_desc" | undefined,
    });

    res.json(result);
  } catch (error) {
    console.error("List activities error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * ─── GET /api/activities/my ─────────────────────────────────────────────
 * Get all activities created by the authenticated user
 *
 * Authentication: Required (Bearer token)
 *
 * Response: 200 OK
 *   { activities: [...] }
 *
 * Errors:
 *   - 401: Authentication required
 *   - 500: Internal server error
 */
export async function myActivities(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    // ── Ensure authentication ────────────────────────────────────────────────
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const activities = await activityService.getMyActivities(req.user.userId);
    res.json({ activities });
  } catch (error) {
    console.error("My activities error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * ─── GET /api/activities/:id ────────────────────────────────────────────
 * Get a single activity by ID with creator information
 *
 * URL parameters:
 *   - id: number (activity ID)
 *
 * Response: 200 OK
 *   { activity: { id, title, description, price, ..., creator: { id, fullName, image, bio } } }
 *
 * Errors:
 *   - 400: Invalid activity ID
 *   - 404: Activity not found
 *   - 500: Internal server error
 */
export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: "Invalid activity ID" });
      return;
    }

    const activity = await activityService.getActivityById(id);
    if (!activity) {
      res.status(404).json({ message: "Activity not found" });
      return;
    }

    res.json({ activity });
  } catch (error) {
    handlePrismaError(error, res, "getActivityById");
  }
}

/**
 * ─── PUT /api/activities/:id ────────────────────────────────────────────
 * Update an activity (must be the creator)
 *
 * ⚠️  BREAKING CHANGE: This endpoint now populates res.locals for middleware.
 *     Similar to create(), middleware can intercept and process the updated entity.
 *
 * Authentication: Required (Bearer token)
 * URL parameters:
 *   - id: number (activity ID)
 *
 * Request body: Partial activity fields
 *   - title?: string
 *   - description?: string
 *   - price?: number
 *   - date?: string ISO date
 *   - location?: string
 *   - latitude?: number
 *   - longitude?: number
 *   - capacity?: number
 *   - category?: string
 *   - images?: string[]
 *   - tags?: string[]
 *
 * Response: 200 OK
 *   { message: "Activity updated successfully", activity: {...} }
 *
 * Errors:
 *   - 400: Invalid activity ID or validation failed
 *   - 401: Authentication required
 *   - 403: You do not own this activity
 *   - 404: Activity not found
 *   - 500: Internal server error
 */
export async function update(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // ── Ensure authentication ────────────────────────────────────────────────
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // ── Validate ID ──────────────────────────────────────────────────────────
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: "Invalid activity ID" });
      return;
    }

    // ── Validate input ──────────────────────────────────────────────────────
    const parsed = updateActivitySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    // ── Update activity ────────────────────────────────────────────────────
    const result = await activityService.updateActivity(
      id,
      parsed.data,
      req.user.userId,
    );

    // ── Handle service layer errors ────────────────────────────────────────
    if ("error" in result) {
      if (result.error === "NOT_FOUND") {
        res.status(404).json({ message: "Activity not found" });
        return;
      }
      if (result.error === "FORBIDDEN") {
        res.status(403).json({ message: "You do not own this activity" });
        return;
      }
    }

    // ── Store in res.locals for middleware (e.g., AI embedding) ────────────
    const activity = (result as any).activity;
    res.locals.activity = activity;
    res.locals.statusCode = 200;
    res.locals.message = "Activity updated successfully";

    return next();
  } catch (err) {
    handlePrismaError(err, res, "updateActivity");
  }
}

/**
 * ─── DELETE /api/activities/:id ─────────────────────────────────────────
 * Delete an activity (must be the creator)
 *
 * Authentication: Required (Bearer token)
 * URL parameters:
 *   - id: number (activity ID)
 *
 * Response: 200 OK
 *   { message: "Activity deleted successfully" }
 *
 * Errors:
 *   - 400: Invalid activity ID
 *   - 401: Authentication required
 *   - 403: You do not own this activity
 *   - 404: Activity not found
 *   - 500: Internal server error
 */
export async function remove(req: AuthRequest, res: Response): Promise<void> {
  try {
    // ── Ensure authentication ────────────────────────────────────────────────
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // ── Validate ID ──────────────────────────────────────────────────────────
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: "Invalid activity ID" });
      return;
    }

    // ── Delete activity ─────────────────────────────────────────────────────
    const result = await activityService.deleteActivity(id, req.user.userId);

    // ── Handle service layer errors ────────────────────────────────────────
    if ("error" in result) {
      if (result.error === "NOT_FOUND") {
        res.status(404).json({ message: "Activity not found" });
        return;
      }
      if (result.error === "FORBIDDEN") {
        res.status(403).json({ message: "You do not own this activity" });
        return;
      }
    }

    res.json({ message: "Activity deleted successfully" });
  } catch (error) {
    handlePrismaError(error, res, "deleteActivity");
  }
}
