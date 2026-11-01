import { Router } from "express";
import Lesson from "../models/Lesson.js";

export const lessonsRouter = Router();

lessonsRouter.get("/", async (req, res, next) => {
  try {
    const filter = { published: true };
    if (req.query.level) filter.level = req.query.level;
    if (req.query.category) filter.category = req.query.category;
    const lessons = await Lesson.find(filter).select("title level category summary").sort({ level: 1, title: 1 });
    res.json(lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      level: lesson.level,
      category: lesson.category,
      description: lesson.summary,
    })));
  } catch (error) {
    next(error);
  }
});

lessonsRouter.get("/:id", async (req, res, next) => {
  try {
    const lesson = await Lesson.findOne({ _id: req.params.id, published: true }).populate("quiz");
    if (!lesson) return res.status(404).json({ message: "Leçon introuvable." });
    res.json({
      id: lesson.id,
      title: lesson.title,
      level: lesson.level,
      category: lesson.category,
      description: lesson.summary,
      content: lesson.content,
      vocabulary: lesson.vocabulary,
      quizId: lesson.quiz?.id,
      quiz: lesson.quiz?.questions.map(({ prompt, choices }) => ({ question: prompt, options: choices })),
    });
  } catch (error) {
    next(error);
  }
});
