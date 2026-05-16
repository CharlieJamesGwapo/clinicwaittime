export const PRIORITY_TYPES = ["NONE", "PWD", "SENIOR", "PREGNANT"] as const;
export type PriorityType = (typeof PRIORITY_TYPES)[number];

export const TICKET_STATUSES = ["WAITING", "CALLED", "SERVING", "DONE", "SKIPPED", "DROPOUT"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const CHANNELS = ["SMS", "EMAIL"] as const;
export type Channel = (typeof CHANNELS)[number];

export const USER_ROLES = ["STAFF", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isPriorityType(v: unknown): v is PriorityType {
  return typeof v === "string" && (PRIORITY_TYPES as readonly string[]).includes(v);
}

export function isChannel(v: unknown): v is Channel {
  return typeof v === "string" && (CHANNELS as readonly string[]).includes(v);
}

export function isUserRole(v: unknown): v is UserRole {
  return typeof v === "string" && (USER_ROLES as readonly string[]).includes(v);
}

export function isTicketStatus(v: unknown): v is TicketStatus {
  return typeof v === "string" && (TICKET_STATUSES as readonly string[]).includes(v);
}
