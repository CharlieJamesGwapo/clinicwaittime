import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ticketPosition } from "@/lib/queue";
import { HeuristicPredictor } from "@/lib/predictor";
import { TicketStatusLive } from "./_live";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ ticket: string }>;
}) {
  const { ticket: number } = await params;
  const ticket = await db.ticket.findUnique({ where: { number } });
  if (!ticket) notFound();

  const positionAhead = await ticketPosition(number);
  const defaultMins = Number(
    (await db.setting.findUnique({ where: { key: "default_consultation_minutes" } }))?.value ?? 15
  );
  const eta = new HeuristicPredictor({ defaultConsultationMinutes: defaultMins }).estimateMinutes({
    positionAhead,
  });

  return (
    <main className="min-h-screen p-8 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-semibold">Ticket {ticket.number}</h1>
      <p>{ticket.patientName}</p>
      <TicketStatusLive
        number={ticket.number}
        initialStatus={ticket.status}
        initialPositionAhead={positionAhead}
        initialEstimatedWaitMinutes={eta}
      />
      <p className="text-xs text-muted-foreground">
        Updates automatically — keep this page open.
      </p>
    </main>
  );
}
