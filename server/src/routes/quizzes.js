import { Router } from "express";
import Quiz from "../models/Quiz.js";
import Lesson from "../models/Lesson.js";
import User from "../models/User.js";
import { optionalAuth } from "../middleware/requireAuth.js";

export const quizzesRouter = Router();

quizzesRouter.post("/:id/submit", optionalAuth, async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz introuvable." });

    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length !== quiz.questions.length ||
      answers.some((answer, index) => !Number.isInteger(answer) || answer < 0 || answer >= quiz.questions[index].choices.length)) {
      return res.status(400).json({ message: "Les réponses du quiz sont invalides." });
    }

    const correct = quiz.questions.reduce((count, question, index) =>
      count + (answers[index] === question.correctIndex ? 1 : 0), 0);
    const score = Math.round((correct / quiz.questions.length) * 100);
    const lesson = await Lesson.findOne({ quiz: quiz._id });
    if (!lesson) return res.status(404).json({ message: "Leçon associée introuvable." });
    if (req.userId) {
      const user = await User.findById(req.userId);
      if (!user) return res.status(401).json({ message: "Compte introuvable." });
      let entry = user.progress.find((item) => item.lesson.equals(lesson._id));
      if (!entry) {
        user.progress.push({ lesson: lesson._id, bestScore: score, attempts: 1 });
        entry = user.progress[user.progress.length - 1];
      } else {
        entry.attempts += 1;
        entry.bestScore = Math.max(entry.bestScore, score);
      }
      if (score >= 70 && !entry.completedAt) entry.completedAt = new Date();
      await user.save();
    }

    res.json({
      score,
      passed: score >= 70,
      explanations: quiz.questions.map((question, index) => ({
        correct: answers[index] === question.correctIndex,
        explanation: question.explanation,
      })),
    });
  } catch (error) {
    next(error);
  }
});
