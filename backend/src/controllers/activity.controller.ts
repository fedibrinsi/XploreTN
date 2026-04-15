import { Request, Response } from "express";
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

// ─── POST /api/activities ───────────────────────────────────────────────────
export async function create(req: AuthRequest, res: Response) {
  try {
    const parsed = createActivitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const activity = await activityService.createActivity(
      parsed.data,
      req.user!.userId,
    );
    return res
      .status(201)
      .json({ message: "Activity created successfully", activity });
  } catch (error) {
    console.error("Create activity error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── GET /api/activities ────────────────────────────────────────────────────
export async function list(req: Request, res: Response) {
  try {
    const { category, status, minPrice, maxPrice, search, page, pageSize } =
      req.query;

    const result = await activityService.getActivities({
      category: category as ActivityCategory | undefined,
      status: status as ActivityStatus | undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      search: search as string | undefined,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 12,
    });

    return res.json(result);
  } catch (error) {
    console.error("List activities error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── GET /api/activities/my ─────────────────────────────────────────────────
export async function myActivities(req: AuthRequest, res: Response) {
  try {
    const activities = await activityService.getMyActivities(req.user!.userId);
    return res.json({ activities });
  } catch (error) {
    console.error("My activities error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── GET /api/activities/:id ────────────────────────────────────────────────
export async function getById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id))
      return res.status(400).json({ message: "Invalid activity ID" });

    const activity = await activityService.getActivityById(id);
    if (!activity)
      return res.status(404).json({ message: "Activity not found" });

    return res.json({ activity });
  } catch (error) {
    console.error("Get activity error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── PUT /api/activities/:id ────────────────────────────────────────────────
export async function update(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id))
      return res.status(400).json({ message: "Invalid activity ID" });

    const parsed = updateActivitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await activityService.updateActivity(
      id,
      parsed.data,
      req.user!.userId,
    );

    if ("error" in result) {
      if (result.error === "NOT_FOUND")
        return res.status(404).json({ message: "Activity not found" });
      if (result.error === "FORBIDDEN")
        return res
          .status(403)
          .json({ message: "You can only edit your own activities" });
    }

    return res.json({
      message: "Activity updated successfully",
      activity: (result as any).activity,
    });
  } catch (error) {
    console.error("Update activity error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// ─── DELETE /api/activities/:id ─────────────────────────────────────────────
export async function remove(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id))
      return res.status(400).json({ message: "Invalid activity ID" });

    const result = await activityService.deleteActivity(id, req.user!.userId);

    if ("error" in result) {
      if (result.error === "NOT_FOUND")
        return res.status(404).json({ message: "Activity not found" });
      if (result.error === "FORBIDDEN")
        return res
          .status(403)
          .json({ message: "You can only delete your own activities" });
    }

    return res.json({ message: "Activity deleted successfully" });
  } catch (error) {
    console.error("Delete activity error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
