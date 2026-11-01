import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { lessonsRouter } from "./routes/lessons.js";
import { quizzesRouter } from "./routes/quizzes.js";
import { progressRouter } from "./routes/progress.js";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/lessons", lessonsRouter);
app.use("/api/quizzes", quizzesRouter);
app.use("/api/progress", progressRouter);

app.use((req, res) => res.status(404).json({ message: `Route introuvable : ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: "Les données envoyées sont invalides." });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ message: "Identifiant invalide." });
  }
  return res.status(500).json({ message: "Une erreur interne est survenue." });
});

export default app;
