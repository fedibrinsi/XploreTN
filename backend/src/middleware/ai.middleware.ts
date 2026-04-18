/**
 * middleware/ai.middleware.ts
 * ───────────────────────────
 * Express middleware that fires embedding requests to the AI service
 * after any Activity, Place, or User row is created or updated.
 *
 * Pattern: fire-and-forget
 * ────────────────────────
 * The embedding call is intentionally NOT awaited in the request cycle.
 * The HTTP response is sent to the client first; embedding happens in the
 * background. This keeps write-endpoint latency low (~5 ms vs ~250 ms).
 *
 * Trade-off: a newly created activity will not appear in search results
 * until the embedding resolves (~200 ms after the response). This is
 * acceptable for a discovery/travel app but can be changed to a blocking
 * await if strict consistency is required.
 *
 * Usage in a route file:
 *   import { afterActivityWrite } from '../middleware/ai.middleware';
 *   router.post('/', protect, createActivity, afterActivityWrite, respond);
 *   router.patch('/:id', protect, updateActivity, afterActivityWrite, respond);
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { isAxiosError } from 'axios';
import { embedActivity, embedPlace, embedUser } from '../services/ai.service';
import type {
  EmbedActivityPayload,
  EmbedPlacePayload,
  EmbedUserPayload,
} from '../types/ai.types';

// ── Typed res.locals ──────────────────────────────────────────────────────────
// Express's default res.locals is typed as Record<string, any>.
// We extend it here for better autocompletion in controllers.

declare module 'express-serve-static-core' {
  interface Locals {
    activity?:   EmbedActivityPayload;
    place?:      EmbedPlacePayload;
    user?:       EmbedUserPayload & { bio?: string };
    statusCode?: number;
  }
}

// ── Internal helper ───────────────────────────────────────────────────────────

/**
 * Execute an async embed function without blocking the request cycle.
 * Structured error logging distinguishes Axios errors (FastAPI responded
 * with a known error) from unexpected failures (network partition, etc.).
 */
function fireAndForget(label: string, fn: () => Promise<unknown>): void {
  fn().catch((err: unknown) => {
    if (isAxiosError(err)) {
      // FastAPI returned an HTTP error — log the detail field if present
      const detail = (err.response?.data as { detail?: string })?.detail;
      console.error(
        `[ai.middleware] ${label} — AI service returned ${err.response?.status}: ${detail ?? err.message}`
      );
    } else if (err instanceof Error) {
      console.error(`[ai.middleware] ${label} — unexpected error: ${err.message}`);
    } else {
      console.error(`[ai.middleware] ${label} — unknown error`, err);
    }
  });
}

// ── Activity middleware ───────────────────────────────────────────────────────

/**
 * Attach after Activity create/update controllers.
 * Requires the controller to set: res.locals.activity = <Prisma Activity row>
 */
export const afterActivityWrite: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const activity = res.locals.activity;

  if (activity) {
    fireAndForget(
      `Activity#${activity.id}`,
      () => embedActivity(activity)
    );
  }

  // Always advance — embedding must not block the response
  next();
};

// ── Place middleware ──────────────────────────────────────────────────────────

/**
 * Attach after Place create/update controllers.
 * Requires the controller to set: res.locals.place = <Prisma Place row>
 */
export const afterPlaceWrite: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const place = res.locals.place;

  if (place) {
    fireAndForget(
      `Place#${place.id}`,
      () => embedPlace(place)
    );
  }

  next();
};

// ── User middleware ───────────────────────────────────────────────────────────

/**
 * Attach after User profile update controllers.
 * Requires the controller to set: res.locals.user = <Prisma User row>
 *
 * Only re-embeds when bio or interests are part of the request body — avoid
 * unnecessary embedding calls for unrelated profile changes (e.g. avatar).
 */
export const afterUserWrite: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = res.locals.user;

  // The fields that influence the user embedding (per schema specification)
  const semanticFields: Array<keyof typeof req.body> = ['bio', 'interests'];
  const hasSemanticChange = semanticFields.some((field) => field in req.body);

  if (user && hasSemanticChange) {
    fireAndForget(
      `User#${user.id}`,
      () => embedUser({
        id:        user.id,
        bio:       user.bio       ?? '',
        interests: user.interests ?? [],
      })
    );
  }

  next();
};