import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/auth";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("XploreTN API running");
});

// SERVIR LES FICHIERS STATIQUES CORRECTEMENT
// Cette ligne sert les fichiers du dossier 'uploads' sous le chemin '/uploads'
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);

export default app;
