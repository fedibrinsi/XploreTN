import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import prisma from "../prisma";

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: Role;
  };
}

export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Malformed token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      email?: string;
    };

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ error: "User not found" });

    // Mapper vers userId pour être cohérent avec les routes
    (req as AuthRequest).user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};
