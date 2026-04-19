import express, { Request, Response, NextFunction } from "express";
import { v2 as cloudinary } from "cloudinary";
import { upload } from "../cloudinary"; // ton config cloudinary
import prisma from "../prisma";
import { authenticateJWT, type AuthRequest } from "../middleware/auth.js";
import { afterUserWrite } from "../middleware/ai.middleware.js";

const router = express.Router();

const respond = (req: Request, res: Response): void => {
  const { user, statusCode = 200, message } = res.locals;
  res.status(statusCode).json({ message, user });
};

// ─── Cloudinary helper ─────────────────────────────────────────────────────────
function extractPublicId(url: string): string | null {
  // ex: https://res.cloudinary.com/xxx/image/upload/v123/xploreTN/profiles/abc.jpg
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  return match ? match[1] : null;
}

// ─── GET /api/profile/me ───────────────────────────────────────────────────────
router.get("/me", authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        image: true,
        bio: true,
        interests: true,
        createdAt: true,
      },
    });

    if (!user)
      return res.status(404).json({ message: "User not found" });

    return res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── PUT /api/profile/update ───────────────────────────────────────────────────
async function updateProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { fullName, bio, interests } = req.body as {
      fullName?: string;
      bio?: string;
      interests?: string[];
    };

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        bio: true,
        interests: true,
      },
    });

    if (!existing) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (fullName !== undefined && fullName.trim().length === 0) {
      res.status(400).json({ message: "The name cannot be empty." });
      return;
    }

    if (bio !== undefined && bio.length > 500) {
      res
        .status(400)
        .json({ message: "The bio cannot exceed 500 characters." });
      return;
    }

    if (interests !== undefined) {
      if (!Array.isArray(interests)) {
        res.status(400).json({
          message: "The interests must be an array of strings.",
        });
        return;
      }
      if (interests.length === 0) {
        res
          .status(400)
          .json({ message: "You must provide at least one interest." });
        return;
      }
      if (
        interests.some(
          (item) => typeof item !== "string" || item.trim().length === 0,
        )
      ) {
        res
          .status(400)
          .json({ message: "Each interest must be a non-empty string." });
        return;
      }
      if (interests.length > 10) {
        res
          .status(400)
          .json({ message: "You can add up to 10 interests." });
        return;
      }
    }

    const completionRequired =
      !existing.bio?.trim() || existing.interests.length === 0;

    if (completionRequired) {
      if (bio === undefined || bio.trim().length === 0) {
        res.status(400).json({ message: "The bio is required." });
        return;
      }

      if (
        interests === undefined ||
        interests.length === 0 ||
        interests.some((item) => typeof item !== "string" || item.trim() === "")
      ) {
        res.status(400).json({
          message: "The interests are required and must be valid.",
        });
        return;
      }
    }

    const sanitizedInterests =
      interests?.map((item) => item.trim()) ?? undefined;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName !== undefined && { fullName: fullName.trim() }),
        ...(bio !== undefined && { bio: bio.trim() }),
        ...(sanitizedInterests !== undefined && {
          interests: sanitizedInterests,
        }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        image: true,
        bio: true,
        interests: true,
      },
    });

    res.locals.user = {
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      role: updated.role,
      image: updated.image,
      bio: updated.bio,
      interests: updated.interests,
    } as any;
    res.locals.statusCode = 200;
    res.locals.message = "Profile updated successfully.";

    next();
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

router.put("/update", authenticateJWT, updateProfile, afterUserWrite, respond);

// ─── POST /api/profile/photo ───────────────────────────────────────────────────
router.post(
  "/photo",
  authenticateJWT,
  upload.single("photo"),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      if (!req.file) {
        return res.status(400).json({ message: "No file received." });
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
          interests: true,
        },
      });

      return res.json({ message: "Photo updated successfully.", user: updated });
    } catch (error) {
      console.error("Upload photo error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
);

// ─── PUT /api/profile/review ───────────────────────────────────────────────────
router.put("/review", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { review } = req.body as { review?: string };

    if (review !== undefined && review.length > 1000) {
      return res
        .status(400)
        .json({ message: "La review ne peut pas dépasser 1000 caractères." });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { review: review ?? null },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        image: true,
        bio: true,
        review: true,
      },
    });

    return res.json({ message: "Review enregistrée.", user: updated });
  } catch (error) {
    console.error("Update review error:", error);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

export default router;
