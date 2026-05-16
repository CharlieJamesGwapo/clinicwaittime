import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const q = typeof body?.query === "string" ? body.query.trim() : "";
  if (!q) return NextResponse.json({ error: "Query is required" }, { status: 400 });

  const isEmail = q.includes("@");

  // Find the most recent active ticket (WAITING / CALLED / SERVING) matching
  // phone or email. Fall back to the latest ticket regardless of status if
  // none are active.
  const where = isEmail
    ? { email: { equals: q, mode: "insensitive" as const } }
    : { phone: q };

  const active = await db.ticket.findFirst({
    where: {
      ...where,
      status: { in: ["WAITING", "CALLED", "SERVING"] },
    },
    orderBy: { createdAt: "desc" },
    select: { number: true, status: true },
  });

  if (active) return NextResponse.json({ ticket: active });

  const latest = await db.ticket.findFirst({
    where,
    orderBy: { createdAt: "desc" },
    select: { number: true, status: true },
  });

  if (!latest) return NextResponse.json({ error: "No ticket found" }, { status: 404 });
  return NextResponse.json({ ticket: latest });
}
