import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/api-auth";
import { callNextWaiting } from "@/lib/queue-ops";
import { emitQueueUpdated } from "@/lib/events";

export async function POST(req: NextRequest) {
  const block = await requireStaff();
  if (block) return block;

  await db.ticket.updateMany({
    where: { status: { in: ["CALLED", "SERVING"] } },
    data: { status: "SKIPPED", completedAt: new Date() },
  });

  const result = await callNextWaiting(req.nextUrl.origin);
  emitQueueUpdated();
  return NextResponse.json(result);
}
