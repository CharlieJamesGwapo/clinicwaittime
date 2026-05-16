import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/api-auth";
import { emitQueueUpdated } from "@/lib/events";
import { renderSms } from "@/lib/sms-templates";
import { writeSmsLog } from "@/lib/sms";
import { isLocale } from "@/lib/i18n/messages";

export async function POST(req: NextRequest) {
  const block = await requireStaff();
  if (block) return block;

  const body = await req.json().catch(() => null);
  const ticketNumber = typeof body?.ticketNumber === "string" ? body.ticketNumber : "";
  if (!ticketNumber) {
    return NextResponse.json({ error: "ticketNumber required" }, { status: 400 });
  }

  const target = await db.ticket.findUnique({ where: { number: ticketNumber } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.status !== "WAITING") {
    return NextResponse.json({ error: "Ticket is not WAITING" }, { status: 409 });
  }

  await db.ticket.updateMany({
    where: { status: { in: ["CALLED", "SERVING"] } },
    data: { status: "WAITING", calledAt: null },
  });

  const updated = await db.ticket.update({
    where: { number: ticketNumber },
    data: { status: "CALLED", calledAt: new Date() },
  });

  await writeSmsLog({
    ticketId: updated.id,
    phone: updated.phone,
    message: renderSms(
      "your-turn",
      {
        name: updated.patientName,
        ticketNumber: updated.number,
        statusUrl: `${req.nextUrl.origin}/q/${updated.number}`,
        estimatedWaitMinutes: 0,
      },
      isLocale(updated.locale) ? updated.locale : "en",
    ),
  });

  emitQueueUpdated();
  return NextResponse.json({ called: { number: updated.number, patientName: updated.patientName } });
}
