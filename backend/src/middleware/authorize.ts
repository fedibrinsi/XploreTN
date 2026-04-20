import { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.js";
import type { Role } from ".prisma/client";

/**
 * Role-based authorization middleware.
 * Must be used AFTER authenticateJWT — expects req.user to be populated.
 *
 * Usage: authorize("CITOYEN")
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };
}
