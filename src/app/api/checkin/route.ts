import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { nextTicketNumber } from "@/lib/ticket-number";
import { ticketPosition } from "@/lib/queue";
import { estimateWaitMinutes } from "@/lib/eta";
import { renderSms } from "@/lib/sms-templates";
import { writeSmsLog } from "@/lib/sms";
import { emitQueueUpdated } from "@/lib/events";
import { isPriorityType } from "@/lib/types";
import { isLocale } from "@/lib/i18n/messages";
import { getServerLocale } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const patientName = typeof body.patientName === "string" ? body.patientName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const priorityType = isPriorityType(body.priorityType) ? body.priorityType : "NONE";
  const requestedLocale = isLocale(body.locale) ? body.locale : null;
  const locale = requestedLocale ?? (await getServerLocale());

  if (!patientName) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "Phone is required" }, { status: 400 });

  const number = await nextTicketNumber();
  const ticket = await db.ticket.create({
    data: { number, patientName, phone, priorityType, locale },
  });

  const positionAhead = await ticketPosition(number);
  const eta = await estimateWaitMinutes(positionAhead);

  const origin = req.nextUrl.origin;
  const statusUrl = `${origin}/q/${number}`;
  const message = renderSms(
    "checkin",
    {
      name: patientName,
      ticketNumber: number,
      statusUrl,
      estimatedWaitMinutes: eta,
    },
    locale,
  );
  await writeSmsLog({ ticketId: ticket.id, phone, message });
  emitQueueUpdated();

  return NextResponse.json({ ticket }, { status: 201 });
}
