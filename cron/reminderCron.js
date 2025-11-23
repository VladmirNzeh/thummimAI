import cron from "node-cron";
import Reminder from "../models/reminder-model.js";
import Chat from "../models/chat-model.js";
import OpenAI from "openai";

// Optional external notifier (email, push, etc.)
async function sendNotification(userId, message) {
  console.log(`Sending notification to User ${userId} → ${message}`);
  // TODO: integrate Firebase, SMTP, Twilio, etc.
}

function computeNextReminder(currentTime, repeat) {
  const next = new Date(currentTime);

  switch (repeat) {
    case "hourly":
      next.setHours(next.getHours() + 1);
      break;
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    default:
      return null; // "none"
  }

  return next;
}

export const startReminderCron = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // ✅ Initialize OpenAI client here
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // FIND REMINDERS DUE NOW
      const dueReminders = await Reminder.find({
        delivered: false,
        time: {
          $lte: now,
          $gte: new Date(now.getTime() - 60000), // 1-minute range
        },
      });

      if (dueReminders.length === 0) return;

      console.log(`⏰ ${dueReminders.length} reminders due now`);

      // BATCH AI REQUEST FOR ALL REMINDERS
      const messages = dueReminders.map((r) => ({
        role: "user",
        content: `Create a short reminder: Tell the user to take ${r.medication} now.`,
      }));

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // ✅ use a valid model name
        messages,
      });

      // Process results
      for (let i = 0; i < dueReminders.length; i++) {
        const r = dueReminders[i];
        const aiResponse = completion.choices[i]?.message?.content ?? "Reminder generated.";

        // Save chat
        await Chat.create({
          userId: r.userId,
          message: `Reminder: ${r.medication}`,
          response: aiResponse,
        });

        // Optional push/email notification
        await sendNotification(r.userId, aiResponse);

        console.log(`🎯 Sent reminder to user ${r.userId}: ${aiResponse}`);

        // MARK AS DELIVERED or RESCHEDULE
        if (r.repeat === "none") {
          r.delivered = true;
        } else {
          const nextTime = computeNextReminder(r.time, r.repeat);
          if (nextTime) {
            r.time = nextTime;
          }
        }

        await r.save();
      }
    } catch (error) {
      console.error("Cron job error:", error);
    }
  });
};
