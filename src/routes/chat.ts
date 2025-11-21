import { Router, Request, Response } from 'express';
import { chatWithOpenAI } from '../services/openaiService';
import prisma from "../prismaClient";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
    try {
        const { userId, message } = req.body;
        if (!message) return res.status(400).json({ error: "Message is required" });

        const aiResult = await chatWithOpenAI(message);

        if (userId) {
            await prisma.interactionLog.create({
                data: {
                    userId,
                    prompt: message,
                    response: aiResult.content,
                    model: "gpt-4o",
                    tokensIn: aiResult.usage.prompt_tokens,
                    tokensOut: aiResult.usage.completion_tokens,
                },
            });
        }

        res.json({ answer: aiResult.content });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message || "Internal Server Error" });
    }
});

export default router;
