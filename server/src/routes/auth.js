import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import User from "../models/User.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const authRouter = Router();
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 1000,
});

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, level: user.level };
}

authRouter.post("/register", loginLimit, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (typeof name !== "string" || !name.trim() || typeof email !== "string" ||
      typeof password !== "string" || password.length < 12) {
      return res.status(400).json({ message: "Indiquez un prénom, un e-mail et un mot de passe de 12 caractères minimum." });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(password, 12),
    });
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("token", token, cookieOptions()).status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Cette adresse e-mail est déjà utilisée." });
    return next(error);
  }
});

authRouter.post("/login", loginLimit, async (req, res, next) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const user = await User.findOne({ email }).select("+passwordHash");
    const valid = user && await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Identifiants invalides." });

    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("token", token, cookieOptions()).json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
  res.status(204).end();
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("name email level");
    if (!user) return res.status(401).json({ message: "Compte introuvable." });
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});
