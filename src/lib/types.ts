export const PRIORITY_TYPES = ["NONE", "PWD", "SENIOR", "PREGNANT"] as const;
export type PriorityType = (typeof PRIORITY_TYPES)[number];

export const TICKET_STATUSES = ["WAITING", "CALLED", "SERVING", "DONE", "SKIPPED", "DROPOUT"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export function isPriorityType(v: unknown): v is PriorityType {
  return typeof v === "string" && (PRIORITY_TYPES as readonly string[]).includes(v);
}
