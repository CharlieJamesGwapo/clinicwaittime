import { db } from "@/lib/db";
import { orderedQueue } from "@/lib/queue";
import { estimateWaitMinutes } from "@/lib/eta";
import { renderSms, type SmsKind } from "@/lib/sms-templates";
import { writeSmsLog } from "@/lib/sms";
import { type Locale, isLocale } from "@/lib/i18n/messages";

interface NotifyParams {
  ticketId: string;
  ticketNumber: string;
  patientName: string;
  phone: string;
  locale: Locale;
  kind: SmsKind;
  statusUrl: string;
  positionAhead: number;
}

async function notify(p: NotifyParams) {
  const eta = await estimateWaitMinutes(p.positionAhead);
  const message = renderSms(
    p.kind,
    {
      name: p.patientName,
      ticketNumber: p.ticketNumber,
      statusUrl: p.statusUrl,
      estimatedWaitMinutes: eta,
    },
    p.locale,
  );
  await writeSmsLog({ ticketId: p.ticketId, phone: p.phone, message });
}

export async function closeCurrentCalled(): Promise<void> {
  await db.ticket.updateMany({
    where: { status: { in: ["CALLED", "SERVING"] } },
    data: { status: "DONE", completedAt: new Date() },
  });
}

export async function callNextWaiting(origin: string): Promise<{
  called: { number: string; patientName: string } | null;
}> {
  const ordered = await orderedQueue();
  const top = ordered.find((t) => t.status === "WAITING");
  if (!top) return { called: null };

  const updated = await db.ticket.update({
    where: { number: top.number },
    data: { status: "CALLED", calledAt: new Date() },
  });

  await notify({
    ticketId: updated.id,
    ticketNumber: updated.number,
    patientName: updated.patientName,
    phone: updated.phone,
    locale: isLocale(updated.locale) ? updated.locale : "en",
    kind: "your-turn",
    statusUrl: `${origin}/q/${updated.number}`,
    positionAhead: 0,
  });

  const afterPromote = await orderedQueue();
  const twoAway = afterPromote.find((t, idx) => idx === 2 && t.status === "WAITING");
  if (twoAway) {
    const row = await db.ticket.findUnique({ where: { number: twoAway.number } });
    if (row) {
      await notify({
        ticketId: row.id,
        ticketNumber: row.number,
        patientName: row.patientName,
        phone: row.phone,
        locale: isLocale(row.locale) ? row.locale : "en",
        kind: "almost",
        statusUrl: `${origin}/q/${row.number}`,
        positionAhead: 2,
      });
    }
  }

  return { called: { number: updated.number, patientName: updated.patientName } };
}
