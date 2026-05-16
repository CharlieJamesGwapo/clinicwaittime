import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const block = await requireAdmin();
  if (block) return block;

  const { key } = await params;
  const body = await req.json().catch(() => null);
  const value = typeof body?.value === "string" ? body.value : "";

  try {
    const setting = await db.setting.update({
      where: { key },
      data: { value },
    });
    return NextResponse.json({ setting });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const block = await requireAdmin();
  if (block) return block;

  const { key } = await params;
  // Protect required keys.
  if (key === "clinic_name" || key === "default_consultation_minutes") {
    return NextResponse.json({ error: "This setting is required and cannot be removed" }, { status: 400 });
  }
  try {
    await db.setting.delete({ where: { key } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
