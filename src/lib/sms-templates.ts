import type { Locale } from "@/lib/i18n/messages";
import type { Channel } from "@/lib/types";

export type SmsKind = "checkin" | "almost" | "your-turn";

export interface SmsContext {
  name: string;
  ticketNumber: string;
  statusUrl: string;
  estimatedWaitMinutes: number;
}

const BODIES: Record<Locale, Record<SmsKind, (ctx: SmsContext) => string>> = {
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

const SUBJECTS: Record<Locale, Record<SmsKind, string>> = {
  en: {
    checkin: "Your clinic ticket",
    almost: "You'll be called soon",
    "your-turn": "It's your turn",
  },
  tl: {
    checkin: "Ang ticket mo sa klinika",
    almost: "Malapit ka nang tawagin",
    "your-turn": "Ikaw na",
  },
};

export function renderSms(kind: SmsKind, ctx: SmsContext, locale: Locale = "en"): string {
  return (BODIES[locale] ?? BODIES.en)[kind](ctx);
}

export function renderNotification(
  channel: Channel,
  kind: SmsKind,
  ctx: SmsContext,
  locale: Locale = "en",
): string {
  const body = renderSms(kind, ctx, locale);
  if (channel === "EMAIL") {
    const subject = (SUBJECTS[locale] ?? SUBJECTS.en)[kind];
    return `Subject: ${subject}\n\n${body}`;
  }
  return body;
}
