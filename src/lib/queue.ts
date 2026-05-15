import { db } from "@/lib/db";

export async function ticketPosition(ticketNumber: string): Promise<number> {
  const ticket = await db.ticket.findUnique({ where: { number: ticketNumber } });
  if (!ticket) return -1;
  if (ticket.status !== "WAITING") return 0;
  return db.ticket.count({
    where: {
      status: "WAITING",
      createdAt: { lt: ticket.createdAt },
    },
  });
}
