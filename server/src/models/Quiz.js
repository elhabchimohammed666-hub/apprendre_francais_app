import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  prompt: { type: String, required: true },
  choices: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true, min: 0 },
  explanation: { type: String, required: true },
}, { _id: false });

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  questions: { type: [questionSchema], validate: (questions) => questions.length > 0 },
}, { timestamps: true });

export default mongoose.model("Quiz", quizSchema);
