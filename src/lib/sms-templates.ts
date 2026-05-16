import type { Locale } from "@/lib/i18n/messages";

export type SmsKind = "checkin" | "almost" | "your-turn";

export interface SmsContext {
  name: string;
  ticketNumber: string;
  statusUrl: string;
  estimatedWaitMinutes: number;
}

const TEMPLATES: Record<Locale, Record<SmsKind, (ctx: SmsContext) => string>> = {
  en: {
    checkin: (c) =>
      `Hi ${c.name}, you're ticket ${c.ticketNumber}. Estimated wait: ${c.estimatedWaitMinutes} min. Track status: ${c.statusUrl}`,
    almost: (c) =>
      `Ticket ${c.ticketNumber} — please return to the clinic. You will be called soon.`,
    "your-turn": (c) =>
      `Ticket ${c.ticketNumber} — please proceed to consultation now.`,
  },
  tl: {
    checkin: (c) =>
      `Hi ${c.name}, ticket mo ang ${c.ticketNumber}. Tantsa ng paghihintay: ${c.estimatedWaitMinutes} minuto. Sundan ang status: ${c.statusUrl}`,
    almost: (c) =>
      `Ticket ${c.ticketNumber} — bumalik na po sa klinika. Malapit na kayong tawagin.`,
    "your-turn": (c) =>
      `Ticket ${c.ticketNumber} — pumunta na po sa consultation room.`,
  },
};

export function renderSms(kind: SmsKind, ctx: SmsContext, locale: Locale = "en"): string {
  return (TEMPLATES[locale] ?? TEMPLATES.en)[kind](ctx);
}
