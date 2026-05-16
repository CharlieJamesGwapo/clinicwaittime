import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { hashPassword } from "@/lib/password";
import { isUserRole } from "@/lib/types";

export async function GET() {
  const block = await requireAdmin();
  if (block) return block;

  const users = await db.user.findMany({
    select: { id: true, email: true, role: true },
    orderBy: { email: "asc" },
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const block = await requireAdmin();
  if (block) return block;

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role = isUserRole(body?.role) ? body.role : "STAFF";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const created = await db.user.create({
    data: { email, passwordHash, role },
    select: { id: true, email: true, role: true },
  });
  return NextResponse.json({ user: created }, { status: 201 });
}
