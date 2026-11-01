import "dotenv/config";
import mongoose from "mongoose";
import { lessons as starterLessons } from "../../client/src/data.js";
import { connectDatabase } from "./config/database.js";
import Lesson from "./models/Lesson.js";
import Quiz from "./models/Quiz.js";

await connectDatabase();

for (const starter of starterLessons) {
  const quiz = await Quiz.findOneAndUpdate(
    { title: `Quiz — ${starter.title}` },
    {
      title: `Quiz — ${starter.title}`,
      questions: starter.quiz.map((question) => ({
        prompt: question.question,
        choices: question.options,
        correctIndex: question.answer,
        explanation: question.explanation,
      })),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await Lesson.findOneAndUpdate(
    { title: starter.title },
    {
      title: starter.title,
      level: starter.level,
      category: starter.category,
      summary: starter.description,
      content: starter.content,
      vocabulary: starter.vocabulary,
      quiz: quiz._id,
      published: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

console.log(`Seeded ${starterLessons.length} lessons and quizzes.`);
await mongoose.disconnect();
