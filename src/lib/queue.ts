import { db } from "@/lib/db";
import { orderQueue, type QueueTicket } from "@/lib/queue-ordering";
import type { PriorityType, TicketStatus } from "@/lib/types";

async function loadActiveTickets(): Promise<QueueTicket[]> {
  const rows = await db.ticket.findMany({
    where: { status: { in: ["WAITING", "CALLED", "SERVING"] } },
  });
  return rows.map((r) => ({
    number: r.number,
    status: r.status as TicketStatus,
    priorityType: r.priorityType as PriorityType,
    createdAt: r.createdAt,
  }));
}

export async function ticketPosition(ticketNumber: string): Promise<number> {
  const tickets = await loadActiveTickets();
  const ordered = orderQueue(tickets);
  const idx = ordered.findIndex((t) => t.number === ticketNumber);
  return idx < 0 ? 0 : idx;
}

export async function orderedQueue(): Promise<QueueTicket[]> {
  return orderQueue(await loadActiveTickets());
}
