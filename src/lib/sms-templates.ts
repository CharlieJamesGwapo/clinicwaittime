export type SmsKind = "checkin" | "almost" | "your-turn";

export interface SmsContext {
  name: string;
  ticketNumber: string;
  statusUrl: string;
  estimatedWaitMinutes: number;
}

export function renderSms(kind: SmsKind, ctx: SmsContext): string {
  switch (kind) {
    case "checkin":
      return `Hi ${ctx.name}, you're ticket ${ctx.ticketNumber}. Estimated wait: ${ctx.estimatedWaitMinutes} min. Track status: ${ctx.statusUrl}`;
    case "almost":
      return `Ticket ${ctx.ticketNumber} — please return to the clinic. You will be called soon.`;
    case "your-turn":
      return `Ticket ${ctx.ticketNumber} — please proceed to consultation now.`;
  }
}
