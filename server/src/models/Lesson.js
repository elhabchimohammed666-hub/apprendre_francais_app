import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  level: { type: String, enum: ["A1", "A2", "B1", "B2"], required: true },
  category: { type: String, enum: ["Vocabulaire", "Grammaire", "Conjugaison"], required: true },
  summary: { type: String, required: true },
  content: [{ heading: String, text: { type: String, required: true } }],
  vocabulary: [[String]],
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
  published: { type: Boolean, default: false },
}, { timestamps: true });

lessonSchema.index({ level: 1, category: 1, published: 1 });

export default mongoose.model("Lesson", lessonSchema);
