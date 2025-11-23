import express from "express";
import auth from "../middleware/auth.js";
import Chat from "../models/chat-model.js";
import Reminder from "../models/reminder-model.js";
import OpenAI from "openai";
import * as chrono from "chrono-node";

const router = express.Router();

router.post("/send", auth, async (req, res) => {
  try {
    // ✅ Initialize OpenAI client inside the route
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });

    // Cache by user (prevent cross-user data leakage)
    const cached = await Chat.findOne({ message, userId: req.user });
    if (cached) {
      const userChat = await Chat.create({
        userId: req.user,
        message,
        response: cached.response,
      });
      return res.json(userChat);
    }

    // Parse reminder
    let reminderAddedText = "";
    if (message.toLowerCase().includes("remind me to")) {
      const parsedDate = chrono.parseDate(message);
      const medicationMatch = message.match(/remind me to (.*) at/i);
      const medication = medicationMatch ? medicationMatch[1] : "Medication";

      if (parsedDate) {
        const reminder = await Reminder.create({
          userId: req.user,
          medication,
          time: parsedDate,
          note: "",
        });

        reminderAddedText = `\n\n✅ Reminder added: ${medication} at ${parsedDate.toLocaleString()}`;
      }
    }

    // All user reminders
    const reminders = await Reminder.find({ userId: req.user });
    let reminderText = "";

    if (reminders.length > 0) {
      reminderText = "Here are the user's reminders:\n";
      reminders.forEach((r) => {
        reminderText += `- ${r.medication} at ${new Date(r.time).toLocaleString()}${r.note ? ` (${r.note})` : ""}\n`;
      });
    }

    const prompt = `${reminderText}\nUser asks: ${message}${reminderAddedText}`;

    // OpenAI call
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // ✅ safer model name
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = completion.choices[0].message.content;

    // Save chat
    const chat = await Chat.create({
      userId: req.user,
      message,
      response: responseText,
    });

    res.json(chat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
