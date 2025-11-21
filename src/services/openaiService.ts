import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function chatWithOpenAI(prompt: string) {
    const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: "You are a helpful assistant for Thummim users." },
            { role: "user", content: prompt },
        ],
        max_tokens: 512,
    });

    const content =
        response.choices?.[0]?.message?.content ?? "";

    const usage = {
        prompt_tokens: response.usage?.prompt_tokens ?? 0,
        completion_tokens: response.usage?.completion_tokens ?? 0,
        total_tokens: response.usage?.total_tokens ?? 0,
    };

    return { content, usage };
}
