import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { isPriorityType, isTicketStatus } from "@/lib/types";

export async function GET(req: NextRequest) {
  const block = await requireAdmin();
  if (block) return block;

  const url = req.nextUrl;
  const q = url.searchParams.get("q") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const priority = url.searchParams.get("priority") ?? "";
  const channel = url.searchParams.get("channel") ?? "";
  const take = Math.min(Number(url.searchParams.get("take") ?? "50"), 200);
  const skip = Math.max(Number(url.searchParams.get("skip") ?? "0"), 0);

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { patientName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }
  if (isTicketStatus(status)) where.status = status;
  if (isPriorityType(priority)) where.priorityType = priority;
  if (channel === "SMS" || channel === "EMAIL") where.channel = channel;

  const [total, tickets] = await Promise.all([
    db.ticket.count({ where }),
    db.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        number: true,
        patientName: true,
        phone: true,
        email: true,
        channel: true,
        priorityType: true,
        status: true,
        reason: true,
        createdAt: true,
        calledAt: true,
        completedAt: true,
      },
    }),
  ]);
  return NextResponse.json({ tickets, total });
}
