import { Router } from "express";
import User from "../models/User.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const progressRouter = Router();

progressRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).populate("progress.lesson", "title level category");
    if (!user) return res.status(401).json({ message: "Compte introuvable." });
    res.json(user.progress.map((entry) => ({
      lesson: entry.lesson,
      bestScore: entry.bestScore,
      attempts: entry.attempts,
      completedAt: entry.completedAt,
    })));
  } catch (error) {
    next(error);
  }
});
