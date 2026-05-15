import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const block = await requireAdmin();
  if (block) return block;

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const tickets = await db.ticket.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: {
      createdAt: true,
      calledAt: true,
      completedAt: true,
      priorityType: true,
      status: true,
    },
  });

  // Daily wait-time trend: mean(calledAt - createdAt) per day
  const waitByDay = new Map<string, { sum: number; count: number }>();
  for (let d = 6; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(day.getDate() - d);
    waitByDay.set(day.toISOString().slice(0, 10), { sum: 0, count: 0 });
  }
  for (const t of tickets) {
    if (!t.calledAt) continue;
    const key = t.createdAt.toISOString().slice(0, 10);
    const bucket = waitByDay.get(key);
    if (!bucket) continue;
    bucket.sum += (t.calledAt.getTime() - t.createdAt.getTime()) / 60_000;
    bucket.count += 1;
  }
  const waitTimeTrend = Array.from(waitByDay.entries()).map(([day, b]) => ({
    day,
    averageWaitMinutes: b.count ? Math.round(b.sum / b.count) : 0,
    sampleSize: b.count,
  }));

  // Peak hours: 0-23 histogram
  const hourCounts = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  for (const t of tickets) {
    hourCounts[t.createdAt.getHours()].count += 1;
  }
  const peakHours = hourCounts.filter((b) => b.hour >= 6 && b.hour <= 19);

  // Dropout rate
  const total = tickets.length;
  const dropouts = tickets.filter((t) => t.status === "DROPOUT" || t.status === "SKIPPED").length;
  const dropoutRate = total ? dropouts / total : 0;

  // Priority breakdown
  const priorityMap = new Map<string, number>();
  for (const t of tickets) {
    priorityMap.set(t.priorityType, (priorityMap.get(t.priorityType) ?? 0) + 1);
  }
  const priorityBreakdown = Array.from(priorityMap.entries()).map(([priorityType, count]) => ({
    priorityType,
    count,
  }));

  return NextResponse.json({
    waitTimeTrend,
    peakHours,
    dropoutRate,
    dropouts,
    total,
    priorityBreakdown,
  });
}
