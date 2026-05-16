import { NextRequest } from "next/server";
import { streamText, convertToModelMessages, tool, stepCountIs, type UIMessage } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { orderedQueue } from "@/lib/queue";
import { estimateWaitMinutes } from "@/lib/eta";

export const runtime = "nodejs";
export const maxDuration = 30;

// Cheap, fast model with bilingual fluency — great for short helper turns.
const MODEL = "anthropic/claude-haiku-4-5";

const SYSTEM_PROMPT = `You are the Clinic Wait-Time Tracker assistant — a friendly, concise helper for a Philippine barangay health clinic demo app.

You can answer in English or Tagalog. Mirror the language of the user's message. If they mix, mix too.

WHAT YOU KNOW
- The app is a real-time queuing system. Patients walk in, scan a QR poster, or open /checkin directly to get a numbered ticket (e.g. A-042).
- After check-in, the patient lands on /q/<ticket-number> showing their live position and estimated wait. They can leave the clinic and come back; we notify them via SMS or email when they are about to be called.
- Priorities: PWD (person with disability), Senior (60+), Pregnant — all jump non-priority tickets that arrived in the same 15-minute window.
- Staff use /staff to Call Next, Skip, Complete, or Push-to-front a ticket. Admins use /admin for analytics and full CRUD over tickets, users, and settings.
- Notifications are SIMULATED in this demo — they appear in /demo/sms-inbox instead of going to real SMS/email providers. Patients still pick a channel (SMS or Email) at check-in so the workflow is realistic.
- Demo accounts: nurse@clinic.test / nurse123 (STAFF), admin@clinic.test / admin123 (ADMIN).

HOW TO BEHAVE
- Be brief. 1-3 short sentences is ideal. Use Markdown sparingly (one bullet list at most).
- For navigation questions, name the exact path: "Go to /checkin" or "Tap 'Patient check-in' on the landing page".
- You CANNOT create, change, or look up real tickets, change anyone's status, or send notifications. If asked to do those things, kindly say so and direct them to the right surface (e.g. /staff for nurses, /admin for admins, or the check-in desk).
- For medical questions, refuse politely and recommend the patient speak with the clinic nurse. Never give diagnoses, treatment advice, or dosage information.
- For information you genuinely don't know (specific clinic hours, doctors on duty, prices), say so honestly and suggest they ask at the front desk.

TOOLS
- You have a getQueueStatus tool that returns the LIVE queue state: who is being served right now, how many are waiting, how many of those are priority, and the estimated wait if someone joined the back of the line this moment. Use it whenever the user asks about timing, the live queue, who is up, or how long until they are seen. Quote the numbers concisely (e.g. "About 30 minutes — 2 people ahead of you including 1 priority").

Stay friendly, calm, and professional. This is a healthcare context.`;

export async function POST(req: NextRequest) {
  let body: { messages?: UIMessage[] } | null = null;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const messages = body?.messages ?? [];
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("messages array required", { status: 400 });
  }

  // Trim to last 12 turns to keep context small + cost low.
  const trimmed = messages.slice(-12);

  try {
    const modelMessages = await convertToModelMessages(trimmed);
    const result = streamText({
      model: gateway(MODEL),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      temperature: 0.4,
      maxOutputTokens: 400,
      stopWhen: stepCountIs(3),
      tools: {
        getQueueStatus: tool({
          description:
            "Read the current clinic queue: how many patients are waiting, how many of those are priority, who is being served right now, and the estimated wait for someone joining at the end of the line. Call this when the user asks about wait time, queue length, who's next, or anything time-sensitive about the live state.",
          inputSchema: z.object({}),
          execute: async () => {
            const queue = await orderedQueue();
            const waiting = queue.filter((t) => t.status === "WAITING");
            const priorityWaiting = waiting.filter((t) => t.priorityType !== "NONE");
            const serving = queue.find(
              (t) => t.status === "CALLED" || t.status === "SERVING",
            );
            const estimatedJoinWaitMinutes = await estimateWaitMinutes(waiting.length);
            return {
              servingTicket: serving?.number ?? null,
              waitingCount: waiting.length,
              priorityWaitingCount: priorityWaiting.length,
              estimatedWaitMinutesIfYouJoinNow: estimatedJoinWaitMinutes,
            };
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("chat error", err);
    return new Response(
      JSON.stringify({ error: "Assistant temporarily unavailable" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
}
