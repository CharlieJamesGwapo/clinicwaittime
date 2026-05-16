import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { ticketPosition } from "@/lib/queue";
import { estimateWaitMinutes } from "@/lib/eta";
import { Card, CardContent } from "@/components/ui/card";
import { PriorityBadge } from "@/lib/labels";
import { ChatWidget } from "@/components/chat-widget";
import { getServerLocale } from "@/lib/i18n/server";
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
  const locale = await getServerLocale();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const ticketUrl = `${proto}://${host}/q/${ticket.number}`;
  const qrDataUrl = await QRCode.toDataURL(ticketUrl, {
    width: 240,
    margin: 1,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  return (
    <main id="main" className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-8 sm:py-16">
      <div className="max-w-md mx-auto">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back
        </Link>
        <Card className="mt-4 fade-in">
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
            {ticket.reason && (
              <div className="w-full rounded-lg bg-slate-50 border border-slate-200 p-3">
                <p className="text-xs uppercase tracking-widest text-slate-500">Reason for visit</p>
                <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{ticket.reason}</p>
              </div>
            )}

            <details className="w-full group">
              <summary className="text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer text-center list-none">
                <span className="inline-flex items-center gap-1">
                  Show QR for staff
                  <span className="transition-transform group-open:rotate-90" aria-hidden="true">›</span>
                </span>
              </summary>
              <div className="mt-3 flex flex-col items-center gap-2">
                <img
                  src={qrDataUrl}
                  alt={`QR code for ticket ${ticket.number}`}
                  width={180}
                  height={180}
                  className="rounded-lg border bg-white p-2"
                />
                <p className="text-[10px] text-slate-400 font-mono break-all text-center max-w-[260px]">
                  {ticketUrl}
                </p>
              </div>
            </details>

            <p className="text-xs text-slate-400 text-center">
              Updates automatically — keep this page open.
            </p>
          </CardContent>
        </Card>
      </div>
      <ChatWidget locale={locale} />
    </main>
  );
}
