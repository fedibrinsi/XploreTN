import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload profiles → xploreTN/profiles
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, _file) => ({
    folder: "xploreTN/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill" }],
  }),
});

// Upload housing → xploreTN/housing
const housingStorage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, _file) => ({
    folder: "xploreTN/housing",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1200, height: 800, crop: "limit" }],
  }),
});

export const upload = multer({ storage: profileStorage }); // pour profile.ts
export const uploadHousing = multer({ storage: housingStorage }); // pour housing.ts
export default cloudinary;
