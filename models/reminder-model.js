import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    medication: String,
    time: String,
    note: String
  },
  { timestamps: true }
);

export default mongoose.model("Reminder", reminderSchema);