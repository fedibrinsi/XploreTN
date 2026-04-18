import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

//
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from "./routes/auth";
import profileRouter from "./routes/profile";
import activityRoutes from "./routes/activities";
import housingRouter from "./routes/housing";
import housingSearchRouter from "./routes/housingSearch";
import exploreSearchRouter from "./routes/exploreSearch";
import messageRouter from "./routes/message";
import uploadRoutes from "./routes/upload";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("XploreTN API running");
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRouter);
app.use("/api/activities", activityRoutes);
app.use("/api/housings", housingRouter);
app.use("/api/housingSearch", housingSearchRouter);
app.use("/api/exploreSearch", exploreSearchRouter);
app.use("/api/messages", messageRouter);
app.use("/api/upload", uploadRoutes);

export default app;
