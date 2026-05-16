import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitQueueUpdated } from "@/lib/events";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ number: string }> },
) {
  const { number } = await params;
  const ticket = await db.ticket.findUnique({ where: { number } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify the caller checked this ticket in: matching cookie token.
  const presented = req.cookies.get(`tkt_${number}`)?.value;
  if (!ticket.cancelToken || !presented || presented !== ticket.cancelToken) {
    return NextResponse.json(
      { error: "Cancellation is only allowed from the device that checked this ticket in." },
      { status: 403 },
    );
  }

  // Only allow self-cancel while WAITING. Once called/serving the staff owns it.
  if (ticket.status !== "WAITING") {
    return NextResponse.json(
      { error: "Ticket can no longer be cancelled — please speak to the nurse" },
      { status: 409 },
    );
  }

  await db.ticket.update({
    where: { number },
    data: {
      status: "DROPOUT",
      completedAt: new Date(),
      cancelToken: null,
    },
  });

  emitQueueUpdated();

  const res = NextResponse.json({ ok: true });
  // Clear the cookie so it can't be reused.
  res.cookies.set(`tkt_${number}`, "", { path: "/", maxAge: 0 });
  return res;
}
