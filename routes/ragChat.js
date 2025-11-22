import express from "express";
import auth from "../middleware/auth.js";
import Chat from "../models/chat-model.js";
import { initializeVectorStore } from "../utils/vectorStore.js";
import OpenAI from "openai";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize Chroma vector store once (promise to prevent race conditions)
const storePromise = initializeVectorStore();

router.post("/send", auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });

    // Wait until vector store is ready
    const store = await storePromise;

    // Step 1: Retrieve top 3 relevant docs
    const results = await store.similaritySearch(message, 3);
    const context = results.length
      ? results.map(r => r.pageContent).join("\n")
      : "No relevant documents found.";

    // Step 2: Combine user message + context for OpenAI
    const prompt = `Answer the user question using the following documents:\n${context}\nUser: ${message}`;

    // Step 3: Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1-chat-latest",
      messages: [{ role: "user", content: prompt }]
    });

    const responseText = completion.choices[0]?.message?.content ?? "No response generated.";
    const usage = completion.usage ?? {};

    // Step 4: Save chat
    const chat = await Chat.create({
      userId: req.user,
      message,
      response: responseText,
      tokensIn: usage.prompt_tokens ?? 0,
      tokensOut: usage.completion_tokens ?? 0
    });

    res.json(chat);
  } catch (err) {
    console.error("Chat route error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
