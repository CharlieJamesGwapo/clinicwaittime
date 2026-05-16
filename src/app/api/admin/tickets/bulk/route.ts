import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { emitQueueUpdated } from "@/lib/events";

export async function POST(req: NextRequest) {
  const block = await requireAdmin();
  if (block) return block;

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const ids: unknown = body?.ids;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }
  const stringIds = ids.filter((v): v is string => typeof v === "string");
  if (stringIds.length === 0) {
    return NextResponse.json({ error: "ids must be strings" }, { status: 400 });
  }
  const CAP = 200;
  if (stringIds.length > CAP) {
    return NextResponse.json({ error: `Up to ${CAP} ids per call` }, { status: 400 });
  }

  if (action === "delete") {
    // Cascade SmsLog rows first to satisfy FK.
    await db.smsLog.deleteMany({ where: { ticketId: { in: stringIds } } });
    const result = await db.ticket.deleteMany({ where: { id: { in: stringIds } } });
    emitQueueUpdated();
    return NextResponse.json({ deleted: result.count });
  }

  if (action === "reset") {
    const result = await db.ticket.updateMany({
      where: { id: { in: stringIds } },
      data: { status: "WAITING", calledAt: null, completedAt: null },
    });
    emitQueueUpdated();
    return NextResponse.json({ reset: result.count });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
