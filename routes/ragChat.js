import express from "express";
import auth from "../middleware/auth.js";
import Chat from "../models/chat-model.js";
import Reminder from "../models/reminder-model.js";
import { initializeVectorStore } from "../utils/vectorStore.js";
import OpenAI from "openai";

const router = express.Router();

// Initialize Chroma vector store once
const storePromise = initializeVectorStore();

// Optional in-memory cache to prevent duplicate queries per user
const queryCache = new Map();

router.post("/send", auth, async (req, res) => {
  try {
    // ✅ Initialize OpenAI client here, after dotenv has loaded
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });

    // Check cache first
    const cacheKey = `${req.user}-${message}`;
    if (queryCache.has(cacheKey)) {
      return res.json({ cached: true, ...queryCache.get(cacheKey) });
    }

    // Wait until vector store is ready
    let store;
    try {
      store = await storePromise;
    } catch (err) {
      console.error("Vector store initialization error:", err);
      return res.status(503).json({ error: "Vector store not ready. Try again later." });
    }

    // Step 1: Retrieve top 3 relevant documents
    let results = [];
    try {
      results = await store.similaritySearch(message, 3);
    } catch (err) {
      console.error("Vector search error:", err);
    }
    const context = results.length
      ? results.map(r => r.pageContent).join("\n")
      : "No relevant documents found.";

    // Step 2: Retrieve user reminders
    let reminderText = "";
    try {
      const reminders = await Reminder.find({ userId: req.user });
      if (reminders.length > 0) {
        reminderText = "User reminders:\n";
        reminders.forEach(r => {
          reminderText += `- ${r.medication} at ${new Date(r.time).toLocaleString()}${r.note ? ` (${r.note})` : ""}\n`;
        });
      }
    } catch (err) {
      console.error("Error fetching reminders:", err);
    }

    // Step 3: Combine context + reminders + user question
    const prompt = `
Answer the user question using the following documents and their reminders:

Documents:
${context}

${reminderText ? `Reminders:\n${reminderText}` : ""}

User question: ${message}
`;

    // Step 4: Call OpenAI
    let responseText = "No response generated.";
    let usage = {};
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // ✅ use a valid model name
        messages: [{ role: "user", content: prompt }]
      });
      responseText = completion.choices[0]?.message?.content ?? responseText;
      usage = completion.usage ?? {};
    } catch (err) {
      console.error("OpenAI API error:", err);
      responseText = "Sorry, I couldn't generate a response at this time.";
    }

    // Step 5: Save chat to DB
    const chat = await Chat.create({
      userId: req.user,
      message,
      response: responseText,
      tokensIn: usage.prompt_tokens ?? 0,
      tokensOut: usage.completion_tokens ?? 0
    });

    // Step 6: Cache the response
    queryCache.set(cacheKey, {
      chatId: chat._id,
      message: chat.message,
      response: chat.response
    });

    res.json(chat);
  } catch (err) {
    console.error("RAG chat route error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
