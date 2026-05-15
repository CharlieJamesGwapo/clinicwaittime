import { db } from "@/lib/db";
import { HeuristicPredictor } from "@/lib/predictor";

async function getRecentConsultationMinutes(): Promise<number[]> {
  const rows = await db.ticket.findMany({
    where: { status: "DONE", calledAt: { not: null }, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    take: 20,
    select: { calledAt: true, completedAt: true },
  });
  return rows
    .map((r) => {
      if (!r.calledAt || !r.completedAt) return null;
      const ms = r.completedAt.getTime() - r.calledAt.getTime();
      return ms / 60000;
    })
    .filter((n): n is number => n !== null && n >= 0);
}

async function getDefaultConsultationMinutes(): Promise<number> {
  const row = await db.setting.findUnique({
    where: { key: "default_consultation_minutes" },
  });
  return Number(row?.value ?? 15);
}

export async function estimateWaitMinutes(positionAhead: number): Promise<number> {
  const [samples, defaultMins] = await Promise.all([
    getRecentConsultationMinutes(),
    getDefaultConsultationMinutes(),
  ]);
  return new HeuristicPredictor({ defaultConsultationMinutes: defaultMins }).estimateMinutes({
    positionAhead,
    recentConsultationMinutes: samples,
  });
}
