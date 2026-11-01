import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", required: true },
  bestScore: { type: Number, min: 0, max: 100, default: 0 },
  attempts: { type: Number, min: 0, default: 0 },
  completedAt: Date,
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  level: { type: String, enum: ["A1", "A2", "B1", "B2"], default: "A1" },
  role: { type: String, enum: ["student", "admin"], default: "student" },
  progress: [progressSchema],
}, { timestamps: true });

export default mongoose.model("User", userSchema);
