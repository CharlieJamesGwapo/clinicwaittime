import { db } from "@/lib/db";

const PER_LETTER = 999;

export function formatTicketNumber(sequence: number): string {
  const letterIndex = Math.floor((sequence - 1) / PER_LETTER);
  const letter = String.fromCharCode("A".charCodeAt(0) + letterIndex);
  const within = ((sequence - 1) % PER_LETTER) + 1;
  return `${letter}-${String(within).padStart(3, "0")}`;
}

function parseTicketSequence(number: string): number {
  const m = number.match(/^([A-Z])-(\d{1,3})$/);
  if (!m) return 0;
  const letterIdx = m[1].charCodeAt(0) - "A".charCodeAt(0);
  const within = parseInt(m[2], 10);
  return letterIdx * PER_LETTER + within;
}

export async function nextTicketNumber(): Promise<string> {
  const all = await db.ticket.findMany({ select: { number: true } });
  const max = all.reduce((m, t) => Math.max(m, parseTicketSequence(t.number)), 0);
  return formatTicketNumber(max + 1);
}
