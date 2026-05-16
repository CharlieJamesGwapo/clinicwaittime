import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { ticketPosition } from "@/lib/queue";
import { estimateWaitMinutes } from "@/lib/eta";
import { Card, CardContent } from "@/components/ui/card";
import { PriorityBadge } from "@/lib/labels";
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
  const eta = await estimateWaitMinutes(positionAhead);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-8 sm:py-16">
      <div className="max-w-md mx-auto">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back
        </Link>
        <Card className="mt-4">
          <CardContent className="pt-6 pb-8 flex flex-col items-center gap-6">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-slate-500">Your ticket</p>
              <p className="font-mono text-5xl sm:text-6xl font-bold tracking-tight mt-1">
                {ticket.number}
              </p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-sm text-slate-600">{ticket.patientName}</span>
                <PriorityBadge priorityType={ticket.priorityType} />
              </div>
            </div>
            <TicketStatusLive
              number={ticket.number}
              initialStatus={ticket.status}
              initialPositionAhead={positionAhead}
              initialEstimatedWaitMinutes={eta}
            />
            <p className="text-xs text-slate-400 text-center">
              Updates automatically — keep this page open.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
