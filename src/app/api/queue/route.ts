import { NextResponse } from "next/server";
import { orderedQueue } from "@/lib/queue";

export async function GET() {
  const queue = await orderedQueue();
  return NextResponse.json({
    queue: queue.map((t) => ({
      number: t.number,
      status: t.status,
      priorityType: t.priorityType,
    })),
  });
}
