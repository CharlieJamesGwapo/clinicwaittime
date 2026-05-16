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

  const number = await nextTicketNumber();
  const ticket = await db.ticket.create({
    data: {
      number,
      patientName,
      phone: phone || email, // keep non-null on legacy column
      email: email || null,
      channel,
      priorityType,
      locale,
    },
  });

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

  return NextResponse.json({ ticket }, { status: 201 });
}
