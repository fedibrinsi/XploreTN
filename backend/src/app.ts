import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/auth";
import profileRouter from "./routes/profile";
import housingRouter from "./routes/housing";
import housingSearchRouter from "./routes/housingSearch";
import exploreSearchRouter from "./routes/exploreSearch";
import messageRouter from "./routes/message";

dotenv.config();

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
app.use("/api/profile", profileRouter);
app.use("/api/housings", housingRouter);
app.use("/api/housingSearch", housingSearchRouter);
app.use("/api/exploreSearch", exploreSearchRouter);
app.use("/api/messages", messageRouter);

export default app;
