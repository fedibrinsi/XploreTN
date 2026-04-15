import express from "express";
import multer from "multer";
import { authenticateJWT } from "../middleware/auth.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// Memory storage to keep file in memory before streaming to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/webp") {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed."));
    }
  },
});

router.post("/", authenticateJWT, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image file provided" });
  }

  // Stream the buffer to Cloudinary
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: "xploretn",
      quality: "auto",
      fetch_format: "auto",
      width: 1600,
      crop: "limit",
    },
    (error, result) => {
      if (error) {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({ message: "Upload failed", error });
      }
      return res.json({ url: result!.secure_url, publicId: result!.public_id });
    }
  );

  uploadStream.end(req.file.buffer);
});

export default router;
