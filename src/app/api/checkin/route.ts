import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { nextTicketNumber } from "@/lib/ticket-number";
import { ticketPosition } from "@/lib/queue";
import { estimateWaitMinutes } from "@/lib/eta";
import { renderNotification } from "@/lib/sms-templates";
import { writeNotification } from "@/lib/sms";
import { emitQueueUpdated } from "@/lib/events";
import { isPriorityType, isChannel, type Channel } from "@/lib/types";
import { isLocale } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const patientName = typeof body.patientName === "string" ? body.patientName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  const priorityType = isPriorityType(body.priorityType) ? body.priorityType : "NONE";
  const channel: Channel = isChannel(body.channel) ? body.channel : "SMS";
  const requestedLocale = isLocale(body.locale) ? body.locale : null;
  const locale = requestedLocale ?? (await getServerLocale());

  if (!patientName) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const recipient = channel === "EMAIL" ? email : phone;
  if (channel === "EMAIL" && !email) {
    return NextResponse.json({ error: "Email is required for email notifications" }, { status: 400 });
  }
  if (channel === "SMS" && !phone) {
    return NextResponse.json({ error: "Phone is required for SMS notifications" }, { status: 400 });
  }

  const cancelToken = crypto.randomUUID();

  // Retry on unique-constraint races when two patients check in at the same
  // millisecond and both compute the same number. After 5 retries surface a
  // 503 so the caller knows to retry rather than the user seeing a silent fail.
  let ticket: Awaited<ReturnType<typeof db.ticket.create>> | null = null;
  let lastErr: unknown = null;
  let number = "";
  for (let attempt = 0; attempt < 5; attempt += 1) {
    number = await nextTicketNumber();
    try {
      ticket = await db.ticket.create({
        data: {
          number,
          patientName,
          phone: phone || email, // keep non-null on legacy column
          email: email || null,
          channel,
          priorityType,
          locale,
          reason: reason || null,
          cancelToken,
        },
      });
      break;
    } catch (err) {
      lastErr = err;
      // P2002 = Unique constraint violation in Prisma
      const code = (err as { code?: string })?.code;
      if (code !== "P2002") throw err;
      // small backoff then try again with a fresh max+1
      await new Promise((r) => setTimeout(r, 20 + attempt * 30));
    }
  }
  if (!ticket) {
    console.error("checkin: could not assign unique ticket number", lastErr);
    return NextResponse.json(
      { error: "Clinic is very busy — please try again in a moment." },
      { status: 503 },
    );
  }

  const positionAhead = await ticketPosition(number);
  const eta = await estimateWaitMinutes(positionAhead);

  const origin = req.nextUrl.origin;
  const statusUrl = `${origin}/q/${number}`;
  const message = renderNotification(
    channel,
    "checkin",
    {
      name: patientName,
      ticketNumber: number,
      statusUrl,
      estimatedWaitMinutes: eta,
    },
    locale,
  );
  await writeNotification({
    ticketId: ticket.id,
    channel,
    recipient,
    message,
  });
  emitQueueUpdated();

  const res = NextResponse.json({ ticket }, { status: 201 });
  // Scope cookie to /q so it travels with the ticket page and the cancel API,
  // but not other paths. HttpOnly so JS can't read or steal it.
  res.cookies.set(`tkt_${number}`, cancelToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return res;
}
