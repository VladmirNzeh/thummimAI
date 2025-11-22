import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import chatbotRoutes from "./routes/chatbot.js";
import ragChatRoutes from "./routes/ragChat.js";

import userRoutes from "./routes/user.js";
import chatRoutes from "./routes/chat.js";
import reminderRoutes from "./routes/reminder.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Routes
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reminder", reminderRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/ragchat", ragChatRoutes);

// Server
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});