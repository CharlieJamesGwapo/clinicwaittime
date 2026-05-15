import { db } from "@/lib/db";

const PER_LETTER = 999;

export function formatTicketNumber(sequence: number): string {
  const letterIndex = Math.floor((sequence - 1) / PER_LETTER);
  const letter = String.fromCharCode("A".charCodeAt(0) + letterIndex);
  const within = ((sequence - 1) % PER_LETTER) + 1;
  return `${letter}-${String(within).padStart(3, "0")}`;
}

export async function nextTicketNumber(now: Date = new Date()): Promise<string> {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const todayCount = await db.ticket.count({
    where: { createdAt: { gte: startOfDay } },
  });
  return formatTicketNumber(todayCount + 1);
}
