import express from "express";
import { authenticateJWT } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import * as activityController from "../controllers/activity.controller.js";

const router = express.Router();

// ─── Public routes ──────────────────────────────────────────────────────────
// GET /api/activities — list all activities (with optional filters)
router.get("/", activityController.list);

// GET /api/activities/my — get activities created by logged-in user
// NOTE: this MUST be before /:id to avoid "my" being parsed as an id
router.get("/my", authenticateJWT, activityController.myActivities);

// GET /api/activities/:id — get activity details
router.get("/:id", activityController.getById);

// ─── Protected routes (CITOYEN only) ────────────────────────────────────────
// POST /api/activities — create a new activity
router.post("/", authenticateJWT, authorize("CITOYEN"), activityController.create);

// PUT /api/activities/:id — update an activity
router.put("/:id", authenticateJWT, authorize("CITOYEN"), activityController.update);

// DELETE /api/activities/:id — delete an activity
router.delete("/:id", authenticateJWT, authorize("CITOYEN"), activityController.remove);

export default router;
