import type { PriorityType, TicketStatus } from "@/lib/types";

export interface QueueTicket {
  number: string;
  status: TicketStatus;
  priorityType: PriorityType;
  createdAt: Date;
}

const WINDOW_MS = 15 * 60 * 1000;

function windowKey(d: Date): number {
  return Math.floor(d.getTime() / WINDOW_MS);
}

function isPriority(p: PriorityType): boolean {
  return p === "PWD" || p === "SENIOR" || p === "PREGNANT";
}

const ACTIVE_RANK: Record<TicketStatus, number> = {
  SERVING: 0,
  CALLED: 1,
  WAITING: 2,
  DONE: 99,
  SKIPPED: 99,
  DROPOUT: 99,
};

export function compareTickets(a: QueueTicket, b: QueueTicket): number {
  const ra = ACTIVE_RANK[a.status];
  const rb = ACTIVE_RANK[b.status];
  if (ra !== rb) return ra - rb;

  if (a.status !== "WAITING") {
    return a.createdAt.getTime() - b.createdAt.getTime();
  }

  const wa = windowKey(a.createdAt);
  const wb = windowKey(b.createdAt);
  if (wa !== wb) return a.createdAt.getTime() - b.createdAt.getTime();

  const pa = isPriority(a.priorityType);
  const pb = isPriority(b.priorityType);
  if (pa !== pb) return pa ? -1 : 1;

  return a.createdAt.getTime() - b.createdAt.getTime();
}

export function orderQueue(tickets: QueueTicket[]): QueueTicket[] {
  return tickets
    .filter((t) => t.status === "WAITING" || t.status === "CALLED" || t.status === "SERVING")
    .sort(compareTickets);
}
