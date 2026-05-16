import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const rows = await db.smsLog.findMany({
    orderBy: { sentAt: "desc" },
    take: 50,
    include: { ticket: { select: { number: true } } },
  });
  return NextResponse.json({
    messages: rows.map((r) => ({
      id: r.id,
      ticketNumber: r.ticket.number,
      channel: r.channel || "SMS",
      recipient: r.recipient || r.phone,
      phone: r.phone,
      message: r.message,
      sentAt: r.sentAt,
    })),
  });
}
