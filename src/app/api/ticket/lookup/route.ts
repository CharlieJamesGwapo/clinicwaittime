import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function normalizePhone(input: string): string {
  return input.replace(/\D+/g, "");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const q = typeof body?.query === "string" ? body.query.trim() : "";
  if (!q) return NextResponse.json({ error: "Query is required" }, { status: 400 });

  const isEmail = q.includes("@");

  // For email: case-insensitive exact match.
  // For phone: digits-only suffix match (handles +63, 0, and country-code-less
  // variants — patient who typed "09171234567" still finds "+639171234567").
  let activeWhere: Record<string, unknown>;
  let anyWhere: Record<string, unknown>;

  if (isEmail) {
    const emailFilter = { equals: q, mode: "insensitive" as const };
    activeWhere = {
      email: emailFilter,
      status: { in: ["WAITING", "CALLED", "SERVING"] },
    };
    anyWhere = { email: emailFilter };
  } else {
    const digits = normalizePhone(q);
    if (digits.length < 4) {
      return NextResponse.json({ error: "Phone is too short" }, { status: 400 });
    }
    // Match the last 10 digits (or full normalized string if shorter) as a
    // suffix — this is the part that uniquely identifies a phone regardless
    // of how the country code is formatted.
    const suffix = digits.slice(-10);
    activeWhere = {
      phone: { contains: suffix },
      status: { in: ["WAITING", "CALLED", "SERVING"] },
    };
    anyWhere = { phone: { contains: suffix } };
  }

  const active = await db.ticket.findFirst({
    where: activeWhere,
    orderBy: { createdAt: "desc" },
    select: { number: true, status: true },
  });

  if (active) return NextResponse.json({ ticket: active });

  const latest = await db.ticket.findFirst({
    where: anyWhere,
    orderBy: { createdAt: "desc" },
    select: { number: true, status: true },
  });

  if (!latest) return NextResponse.json({ error: "No ticket found" }, { status: 404 });
  return NextResponse.json({ ticket: latest });
}
