import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const block = await requireAdmin();
  if (block) return block;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const tickets = await db.ticket.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    orderBy: { createdAt: "asc" },
  });

  const header = [
    "number",
    "patientName",
    "phone",
    "priorityType",
    "status",
    "createdAt",
    "calledAt",
    "completedAt",
    "waitMinutes",
    "consultMinutes",
  ];
  const lines = [header.join(",")];
  for (const t of tickets) {
    const waitMin =
      t.calledAt ? Math.round((t.calledAt.getTime() - t.createdAt.getTime()) / 60_000) : "";
    const consultMin =
      t.calledAt && t.completedAt
        ? Math.round((t.completedAt.getTime() - t.calledAt.getTime()) / 60_000)
        : "";
    lines.push(
      [
        t.number,
        t.patientName,
        t.phone,
        t.priorityType,
        t.status,
        t.createdAt.toISOString(),
        t.calledAt?.toISOString() ?? "",
        t.completedAt?.toISOString() ?? "",
        waitMin,
        consultMin,
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  const filename = `tickets-7d-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
