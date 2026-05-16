import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const block = await requireAdmin();
  if (block) return block;

  const settings = await db.setting.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const block = await requireAdmin();
  if (block) return block;

  const body = await req.json().catch(() => null);
  const key = typeof body?.key === "string" ? body.key.trim() : "";
  const value = typeof body?.value === "string" ? body.value : "";

  if (!key) return NextResponse.json({ error: "Key is required" }, { status: 400 });
  if (!/^[a-z0-9_]+$/.test(key)) {
    return NextResponse.json(
      { error: "Key must be lowercase letters, numbers, and underscores only" },
      { status: 400 },
    );
  }

  const setting = await db.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  return NextResponse.json({ setting });
}
