import { PrismaClient } from "@prisma/client";
import { formatTicketNumber } from "../src/lib/ticket-number";

const db = new PrismaClient();

// Deterministic RNG (LCG) so charts look the same every demo run.
let seed = 0xc0ffee;
function rng(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

function pickHourWeighted(): number {
  const buckets: [number, number][] = [
    [8, 2], [9, 4], [10, 4], [11, 3],
    [12, 1], [13, 3], [14, 3], [15, 2], [16, 1],
  ];
  const total = buckets.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [h, w] of buckets) {
    r -= w;
    if (r <= 0) return h;
  }
  return 9;
}

function pickPriority(): "NONE" | "PWD" | "SENIOR" | "PREGNANT" {
  if (rng() < 0.78) return "NONE";
  const r = rng();
  if (r < 0.4) return "SENIOR";
  if (r < 0.75) return "PWD";
  return "PREGNANT";
}

async function main() {
  await db.smsLog.deleteMany();
  await db.ticket.deleteMany();

  const now = new Date();
  let seq = 0;
  let created = 0;

  for (let d = 6; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(day.getDate() - d);
    day.setHours(0, 0, 0, 0);

    const isToday = d === 0;
    const ticketsToday = 8 + Math.floor(rng() * 8); // 8–15 tickets/day

    for (let i = 0; i < ticketsToday; i++) {
      seq += 1;
      const hour = pickHourWeighted();
      const minute = Math.floor(rng() * 60);
      const createdAt = new Date(day);
      createdAt.setHours(hour, minute, 0, 0);

      const priorityType = pickPriority();

      let status: "DONE" | "SKIPPED" | "DROPOUT" | "WAITING" = "DONE";
      let calledAt: Date | null = null;
      let completedAt: Date | null = null;

      const sr = rng();
      if (isToday && sr < 0.25) {
        status = "WAITING";
      } else if (sr < 0.78) {
        const waitMin = 5 + Math.floor(rng() * 30);
        const consultMin = 8 + Math.floor(rng() * 20);
        calledAt = new Date(createdAt.getTime() + waitMin * 60_000);
        completedAt = new Date(calledAt.getTime() + consultMin * 60_000);
        status = "DONE";
      } else if (sr < 0.90) {
        const waitMin = 5 + Math.floor(rng() * 30);
        calledAt = new Date(createdAt.getTime() + waitMin * 60_000);
        completedAt = new Date(calledAt.getTime() + 60_000);
        status = "SKIPPED";
      } else {
        completedAt = new Date(createdAt.getTime() + 50 * 60_000);
        status = "DROPOUT";
      }

      await db.ticket.create({
        data: {
          number: formatTicketNumber(seq),
          patientName: `Patient ${seq}`,
          phone: `+6391700${String(seq).padStart(5, "0")}`,
          priorityType,
          status,
          createdAt,
          calledAt,
          completedAt,
        },
      });
      created += 1;
    }
  }

  console.log(`Seeded ${created} historical tickets across 7 days`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
