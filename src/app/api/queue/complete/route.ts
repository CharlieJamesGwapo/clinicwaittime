import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/api-auth";
import { emitQueueUpdated } from "@/lib/events";

export async function POST() {
  const block = await requireStaff();
  if (block) return block;

  const updated = await db.ticket.updateMany({
    where: { status: { in: ["CALLED", "SERVING"] } },
    data: { status: "DONE", completedAt: new Date() },
  });

  emitQueueUpdated();
  return NextResponse.json({ completed: updated.count });
}
