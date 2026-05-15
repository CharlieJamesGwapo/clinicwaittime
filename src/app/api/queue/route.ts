import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orderedQueue } from "@/lib/queue";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isStaff = role === "STAFF" || role === "ADMIN";

  const queue = await orderedQueue();

  if (!isStaff) {
    return NextResponse.json({
      queue: queue.map((t) => ({
        number: t.number,
        status: t.status,
        priorityType: t.priorityType,
      })),
    });
  }

  const rows = await db.ticket.findMany({
    where: { number: { in: queue.map((t) => t.number) } },
    select: {
      number: true,
      patientName: true,
      phone: true,
      priorityType: true,
      status: true,
      createdAt: true,
      calledAt: true,
    },
  });
  const byNumber = new Map(rows.map((r) => [r.number, r]));

  return NextResponse.json({
    queue: queue
      .map((t) => byNumber.get(t.number))
      .filter((r): r is NonNullable<typeof r> => Boolean(r)),
  });
}
