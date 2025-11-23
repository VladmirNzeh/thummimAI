import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    medication: { type: String, required: true },
    time: { type: Date, required: true },
    note: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("Reminder", reminderSchema);
