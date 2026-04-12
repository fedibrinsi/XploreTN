import app from "./app";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/auth";
import profileRouter from "./routes/profile";
import housingRouter from "./routes/housing";
import housingSearchRouter from "./routes/housingSearch";

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques depuis le dossier uploads à la racine /uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRouter);
app.use("/api/housings", housingRouter);
app.use("/api/housingSearch", housingSearchRouter);
