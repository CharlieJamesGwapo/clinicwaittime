import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitQueueUpdated } from "@/lib/events";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ number: string }> },
) {
  const { number } = await params;
  const ticket = await db.ticket.findUnique({ where: { number } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only allow self-cancel while WAITING. Once called/serving the staff owns it.
  if (ticket.status !== "WAITING") {
    return NextResponse.json(
      { error: "Ticket can no longer be cancelled — please speak to the nurse" },
      { status: 409 },
    );
  }

  await db.ticket.update({
    where: { number },
    data: { status: "DROPOUT", completedAt: new Date() },
  });

  emitQueueUpdated();
  return NextResponse.json({ ok: true });
}
