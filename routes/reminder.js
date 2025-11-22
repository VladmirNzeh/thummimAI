import express from "express";
import Reminder from "../models/reminder-model.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Protected route
router.post("/add", auth, async (req, res) => {
  try {
    const reminder = await Reminder.create({
      ...req.body,
      userId: req.user // from JWT
    });

    res.json(reminder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;