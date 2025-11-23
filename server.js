import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import chatbotRoutes from "./routes/chatbot.js";
import ragChatRoutes from "./routes/ragChat.js";
import userRoutes from "./routes/user.js";
import chatRoutes from "./routes/chat.js";
import reminderRoutes from "./routes/reminder.js";


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Debug: check critical env vars
if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY is missing. Make sure it's set in your .env file.");
}
if (!process.env.MONGO_URI) {
  console.warn("⚠️ MONGO_URI is missing. MongoDB connection may fail.");
}

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // exit if DB fails
    });

// Routes
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reminder", reminderRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/ragchat", ragChatRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
