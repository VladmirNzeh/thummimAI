import express from "express";
import Reminder from "../models/reminder-model.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Protected route: Add a reminder
router.post("/add", auth, async (req, res) => {
  try {
    const { medication, time, note } = req.body;

    if (!medication || !time) {
      return res.status(400).json({ error: "Medication and time are required" });
    }

    const reminder = await Reminder.create({
      medication,
      time,
      note: note || "",
      userId: req.user, // from JWT
    });

    res.status(201).json(reminder);
  } catch (err) {
    console.error("Error creating reminder:", err);
    res.status(500).json({ error: "Failed to create reminder" });
  }
});

// Optional: Get all reminders for the authenticated user
router.get("/", auth, async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.user }).sort({ time: 1 });
    res.json(reminders);
  } catch (err) {
    console.error("Error fetching reminders:", err);
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

// Optional: Delete a reminder
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Reminder.findOneAndDelete({ _id: req.params.id, userId: req.user });
    if (!deleted) {
      return res.status(404).json({ error: "Reminder not found" });
    }
    res.json({ message: "Reminder deleted successfully" });
  } catch (err) {
    console.error("Error deleting reminder:", err);
    res.status(500).json({ error: "Failed to delete reminder" });
  }
});

export default router;
