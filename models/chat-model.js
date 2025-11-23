import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    response: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
