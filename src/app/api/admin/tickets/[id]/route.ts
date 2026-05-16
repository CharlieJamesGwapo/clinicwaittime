import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";
import { emitQueueUpdated } from "@/lib/events";
import { isPriorityType, isTicketStatus } from "@/lib/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const block = await requireAdmin();
  if (block) return block;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.patientName === "string") data.patientName = body.patientName.trim();
  if (typeof body.phone === "string") data.phone = body.phone.trim();
  if (typeof body.email === "string") data.email = body.email.trim() || null;
  if (isPriorityType(body.priorityType)) data.priorityType = body.priorityType;
  if (isTicketStatus(body.status)) {
    data.status = body.status;
    if (body.status === "WAITING") data.calledAt = null;
    if (body.status === "DONE" && !body.completedAt) data.completedAt = new Date();
  }

  try {
    const updated = await db.ticket.update({ where: { id }, data });
    emitQueueUpdated();
    return NextResponse.json({ ticket: updated });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const block = await requireAdmin();
  if (block) return block;

  const { id } = await params;
  try {
    // Cascade: remove this ticket's notification log entries first.
    await db.smsLog.deleteMany({ where: { ticketId: id } });
    await db.ticket.delete({ where: { id } });
    emitQueueUpdated();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
