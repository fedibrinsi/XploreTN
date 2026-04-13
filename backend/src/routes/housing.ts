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
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  return match ? match[1] : null;
}

async function deleteCloudinaryImages(urls: string[]): Promise<void> {
  await Promise.allSettled(
    urls
      .filter((url) => url.includes("res.cloudinary.com"))
      .map((url) => {
        const publicId = extractPublicId(url);
        return publicId
          ? cloudinary.uploader.destroy(publicId)
          : Promise.resolve();
      }),
  );
}

// ─── Validation ────────────────────────────────────────────────────────────────
const VALID_HOUSING_TYPES = [
  "APARTMENT",
  "VILLA",
  "STUDIO",
  "TRADITIONAL_HOUSE",
  "FARM_STAY",
  "GUESTHOUSE",
  "RIAD",
  "CHALET",
] as const;

type HousingType = (typeof VALID_HOUSING_TYPES)[number];

interface HousingBody {
  title: string;
  description: string;
  location: string;
  type: HousingType;
  floors: number;
  rooms: number;
  familyMembers: number;
  maxTourists: number;
  maxStayDays: number;
}

function str(val: unknown): string {
  if (Array.isArray(val)) return String(val[0] ?? "");
  return String(val ?? "");
}

function validateHousingBody(body: Partial<HousingBody>): string | null {
  const {
    title,
    description,
    location,
    type,
    floors,
    rooms,
    familyMembers,
    maxTourists,
    maxStayDays,
  } = body;
  if (!title?.trim() || title.trim().length < 5 || title.trim().length > 100)
    return "Le titre doit comporter entre 5 et 100 caractères.";
  if (
    !description?.trim() ||
    description.trim().length < 20 ||
    description.trim().length > 1000
  )
    return "La description doit comporter entre 20 et 1000 caractères.";
  if (!location?.trim() || location.trim().length < 3)
    return "Veuillez fournir une localisation valide.";
  if (!type || !VALID_HOUSING_TYPES.includes(type))
    return "Type de logement invalide.";
  if (
    !Number.isInteger(Number(floors)) ||
    Number(floors) < 1 ||
    Number(floors) > 10
  )
    return "Le nombre d'étages doit être entre 1 et 10.";
  if (
    !Number.isInteger(Number(rooms)) ||
    Number(rooms) < 1 ||
    Number(rooms) > 20
  )
    return "Le nombre de chambres doit être entre 1 et 20.";
  if (
    !Number.isInteger(Number(familyMembers)) ||
    Number(familyMembers) < 1 ||
    Number(familyMembers) > 15
  )
    return "Le nombre de membres de la famille doit être entre 1 et 15.";
  if (
    !Number.isInteger(Number(maxTourists)) ||
    Number(maxTourists) < 1 ||
    Number(maxTourists) > 20
  )
    return "Le nombre max de touristes doit être entre 1 et 20.";
  if (
    !Number.isInteger(Number(maxStayDays)) ||
    Number(maxStayDays) < 1 ||
    Number(maxStayDays) > 365
  )
    return "La durée max de séjour doit être entre 1 et 365 jours.";
  return null;
}

// ─── GET /api/housings/view ────────────────────────────────────────────────────
router.get("/view", authMiddleware, async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user.id;
    const housings = await prisma.housing.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
    });
    return res.json(housings);
  } catch (error) {
    console.error("List housings error:", error);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

// ─── GET /api/housings/:id ─────────────────────────────────────────────────────
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user.id;
    const id = str(req.params.id);
    const housing = await prisma.housing.findUnique({ where: { id } });
    if (!housing)
      return res.status(404).json({ message: "Logement introuvable." });
    if (housing.ownerId !== ownerId)
      return res.status(403).json({ message: "Accès refusé." });
    return res.json(housing);
  } catch (error) {
    console.error("Get housing error:", error);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

// ─── POST /api/housings/new ────────────────────────────────────────────────────
router.post(
  "/new",
  authMiddleware,
  upload.array("images", 10),
  async (req: Request, res: Response) => {
    try {
      const ownerId = (req as any).user.id;

      const body: Partial<HousingBody> = {
        title: str(req.body.title),
        description: str(req.body.description),
        location: str(req.body.location),
        type: str(req.body.type) as HousingType,
        floors: Number(str(req.body.floors)),
        rooms: Number(str(req.body.rooms)),
        familyMembers: Number(str(req.body.familyMembers)),
        maxTourists: Number(str(req.body.maxTourists)),
        maxStayDays: Number(str(req.body.maxStayDays)),
      };

      const validationError = validateHousingBody(body);
      if (validationError)
        return res.status(400).json({ message: validationError });

      // req.files[].path = URLs Cloudinary complètes
      const files = req.files as Express.Multer.File[];
      const imageUrls = files.map((f) => f.path);

      const housing = await prisma.housing.create({
        data: {
          title: body.title!.trim(),
          description: body.description!.trim(),
          location: body.location!.trim(),
          type: body.type!,
          floors: body.floors!,
          rooms: body.rooms!,
          familyMembers: body.familyMembers!,
          maxTourists: body.maxTourists!,
          maxStayDays: body.maxStayDays!,
          images: imageUrls,
          ownerId,
        },
      });

      return res
        .status(201)
        .json({ message: "Logement créé avec succès.", housing });
    } catch (error) {
      console.error("Create housing error:", error);
      return res.status(500).json({ message: "Erreur interne du serveur" });
    }
  },
);

// ─── PUT /api/housings/:id ─────────────────────────────────────────────────────
router.put(
  "/:id",
  authMiddleware,
  upload.array("images", 10),
  async (req: Request, res: Response) => {
    try {
      const ownerId = (req as any).user.id;
      const id = str(req.params.id);

      const existing = await prisma.housing.findUnique({ where: { id } });
      if (!existing)
        return res.status(404).json({ message: "Logement introuvable." });
      if (existing.ownerId !== ownerId)
        return res.status(403).json({ message: "Accès refusé." });

      const body: Partial<HousingBody> = {
        title:
          req.body.title !== undefined ? str(req.body.title) : existing.title,
        description:
          req.body.description !== undefined
            ? str(req.body.description)
            : existing.description,
        location:
          req.body.location !== undefined
            ? str(req.body.location)
            : existing.location,
        type:
          req.body.type !== undefined
            ? (str(req.body.type) as HousingType)
            : existing.type,
        floors:
          req.body.floors !== undefined
            ? Number(str(req.body.floors))
            : existing.floors,
        rooms:
          req.body.rooms !== undefined
            ? Number(str(req.body.rooms))
            : existing.rooms,
        familyMembers:
          req.body.familyMembers !== undefined
            ? Number(str(req.body.familyMembers))
            : existing.familyMembers,
        maxTourists:
          req.body.maxTourists !== undefined
            ? Number(str(req.body.maxTourists))
            : existing.maxTourists,
        maxStayDays:
          req.body.maxStayDays !== undefined
            ? Number(str(req.body.maxStayDays))
            : existing.maxStayDays,
      };

      const validationError = validateHousingBody(body);
      if (validationError)
        return res.status(400).json({ message: validationError });

      // Supprimer les images demandées (Cloudinary + liste)
      let currentImages: string[] = existing.images as string[];
      const toRemove: string[] = req.body.removeImages
        ? JSON.parse(str(req.body.removeImages))
        : [];

      if (toRemove.length > 0) {
        await deleteCloudinaryImages(toRemove);
        currentImages = currentImages.filter((url) => !toRemove.includes(url));
      }

      // Ajouter les nouvelles images uploadées
      const newFiles = req.files as Express.Multer.File[];
      const newUrls = newFiles.map((f) => f.path);
      const finalImages = [...currentImages, ...newUrls];

      const updated = await prisma.housing.update({
        where: { id },
        data: {
          title: body.title!.trim(),
          description: body.description!.trim(),
          location: body.location!.trim(),
          type: body.type!,
          floors: body.floors!,
          rooms: body.rooms!,
          familyMembers: body.familyMembers!,
          maxTourists: body.maxTourists!,
          maxStayDays: body.maxStayDays!,
          images: finalImages,
        },
      });

      return res.json({ message: "Logement mis à jour.", housing: updated });
    } catch (error) {
      console.error("Update housing error:", error);
      return res.status(500).json({ message: "Erreur interne du serveur" });
    }
  },
);

// ─── DELETE /api/housings/:id ──────────────────────────────────────────────────
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const ownerId = (req as any).user.id;
    const id = str(req.params.id);

    const existing = await prisma.housing.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ message: "Logement introuvable." });
    if (existing.ownerId !== ownerId)
      return res.status(403).json({ message: "Accès refusé." });

    // Supprimer toutes les images Cloudinary associées
    await deleteCloudinaryImages(existing.images as string[]);

    await prisma.housing.delete({ where: { id } });

    return res.json({ message: "Logement supprimé avec succès.", id });
  } catch (error) {
    console.error("Delete housing error:", error);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

export default router;
