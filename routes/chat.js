import express from "express";
import Chat from "../models/chat-model.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Protected: Save chat messages
router.post("/send", auth, async (req, res) => {
  try {
    const { message, response } = req.body;

    const saved = await Chat.create({
      userId: req.user,
      message,
      response
    });

    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;