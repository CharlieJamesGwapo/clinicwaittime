import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/api-auth";
import { closeCurrentCalled, callNextWaiting } from "@/lib/queue-ops";
import { emitQueueUpdated } from "@/lib/events";

export async function POST(req: NextRequest) {
  const block = await requireStaff();
  if (block) return block;

  await closeCurrentCalled();
  const result = await callNextWaiting(req.nextUrl.origin);

  emitQueueUpdated();
  return NextResponse.json(result);
}
