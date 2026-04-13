import express from "express";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import { upload } from "../cloudinary"; // ton config cloudinary
import prisma from "../prisma";

const router = express.Router();

// ─── Auth middleware ───────────────────────────────────────────────────────────
interface JwtPayload {
  id: number;
  email: string;
}

function authMiddleware(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token manquant ou invalide" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret",
    ) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Token expiré ou invalide" });
  }
}

// ─── Cloudinary helper ─────────────────────────────────────────────────────────
function extractPublicId(url: string): string | null {
  // ex: https://res.cloudinary.com/xxx/image/upload/v123/xploreTN/profiles/abc.jpg
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  return match ? match[1] : null;
}

// ─── GET /api/profile/me ───────────────────────────────────────────────────────
router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        image: true,
        bio: true,
        createdAt: true,
      },
    });
    if (!user)
      return res.status(404).json({ message: "Utilisateur introuvable" });
    return res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

// ─── PUT /api/profile/update ───────────────────────────────────────────────────
router.put("/update", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { fullName, bio } = req.body as { fullName?: string; bio?: string };

    if (fullName !== undefined && fullName.trim().length === 0) {
      return res.status(400).json({ message: "Le nom ne peut pas être vide." });
    }
    if (bio !== undefined && bio.length > 500) {
      return res
        .status(400)
        .json({ message: "La bio ne peut pas dépasser 500 caractères." });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName !== undefined && { fullName: fullName.trim() }),
        ...(bio !== undefined && { bio }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        image: true,
        bio: true,
      },
    });

    return res.json({ message: "Profil mis à jour.", user: updated });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

// ─── POST /api/profile/photo ───────────────────────────────────────────────────
router.post(
  "/photo",
  authMiddleware,
  upload.single("photo"),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier reçu." });
      }

      // req.file.path = URL Cloudinary complète (multer-storage-cloudinary)
      const imageUrl = req.file.path;

      // Supprimer l'ancienne photo Cloudinary si elle existe
      const existing = await prisma.user.findUnique({ where: { id: userId } });
      if (existing?.image?.includes("res.cloudinary.com")) {
        const publicId = extractPublicId(existing.image);
        if (publicId) {
          await cloudinary.uploader
            .destroy(publicId)
            .catch((err) => console.warn("Cloudinary delete warning:", err));
        }
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { image: imageUrl },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          image: true,
          bio: true,
        },
      });

      return res.json({ message: "Photo mise à jour.", user: updated });
    } catch (error) {
      console.error("Upload photo error:", error);
      return res.status(500).json({ message: "Erreur interne du serveur" });
    }
  },
);

export default router;
