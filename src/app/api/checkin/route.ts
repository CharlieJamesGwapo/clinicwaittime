import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { nextTicketNumber } from "@/lib/ticket-number";
import { ticketPosition } from "@/lib/queue";
import { estimateWaitMinutes } from "@/lib/eta";
import { renderSms } from "@/lib/sms-templates";
import { writeSmsLog } from "@/lib/sms";
import { isPriorityType } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const patientName = typeof body.patientName === "string" ? body.patientName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const priorityType = isPriorityType(body.priorityType) ? body.priorityType : "NONE";

  if (!patientName) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "Phone is required" }, { status: 400 });

  const number = await nextTicketNumber();
  const ticket = await db.ticket.create({
    data: { number, patientName, phone, priorityType },
  });

  const positionAhead = await ticketPosition(number);
  const eta = await estimateWaitMinutes(positionAhead);

  const origin = req.nextUrl.origin;
  const statusUrl = `${origin}/q/${number}`;
  const message = renderSms("checkin", {
    name: patientName,
    ticketNumber: number,
    statusUrl,
    estimatedWaitMinutes: eta,
  });
  await writeSmsLog({ ticketId: ticket.id, phone, message });

  return NextResponse.json({ ticket }, { status: 201 });
}
