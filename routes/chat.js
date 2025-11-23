import express from "express";
import Chat from "../models/chat-model.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Protected: Save chat messages
router.post("/send", auth, async (req, res) => {
  try {
    const { message, response } = req.body;

    if (!message || !response) {
      return res.status(400).json({ error: "Message and response are required" });
    }

    const saved = await Chat.create({
      userId: req.user,
      message,
      response,
    });

    res.status(201).json(saved);
  } catch (err) {
    console.error("Error saving chat:", err);
    res.status(500).json({ error: "Failed to save chat" });
  }
});

// Optional: Get all chats for a user
router.get("/", auth, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user }).sort({ createdAt: -1 });
    res.json(chats);
  } catch (err) {
    console.error("Error fetching chats:", err);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

export default router;
