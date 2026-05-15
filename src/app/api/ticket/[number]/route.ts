import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ticketPosition } from "@/lib/queue";
import { HeuristicPredictor } from "@/lib/predictor";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;
  const ticket = await db.ticket.findUnique({ where: { number } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const positionAhead = await ticketPosition(number);
  const defaultMins = Number(
    (await db.setting.findUnique({ where: { key: "default_consultation_minutes" } }))?.value ?? 15
  );
  const eta = new HeuristicPredictor({ defaultConsultationMinutes: defaultMins }).estimateMinutes({
    positionAhead,
  });

  return NextResponse.json({
    number: ticket.number,
    patientName: ticket.patientName,
    status: ticket.status,
    priorityType: ticket.priorityType,
    positionAhead,
    estimatedWaitMinutes: eta,
    createdAt: ticket.createdAt,
  });
}
