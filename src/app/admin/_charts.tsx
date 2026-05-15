"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Analytics = {
  waitTimeTrend: { day: string; averageWaitMinutes: number; sampleSize: number }[];
  peakHours: { hour: number; count: number }[];
  dropoutRate: number;
  dropouts: number;
  total: number;
  priorityBreakdown: { priorityType: string; count: number }[];
};

const PRIORITY_COLORS: Record<string, string> = {
  NONE: "#94a3b8",
  PWD: "#f59e0b",
  SENIOR: "#10b981",
  PREGNANT: "#ec4899",
};

export function AdminCharts() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/analytics", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch {
        /* retry on next event */
      }
    };

    load();

    const es = new EventSource("/api/queue/stream");
    es.addEventListener("queue_updated", load);

    return () => {
      cancelled = true;
      es.close();
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="grid place-items-center py-20">
        <p className="text-sm text-muted-foreground">Loading analytics…</p>
      </div>
    );
  }

  const avgWaitOverall =
    data.waitTimeTrend.length === 0
      ? 0
      : Math.round(
          data.waitTimeTrend.reduce(
            (s, d) => s + d.averageWaitMinutes * d.sampleSize,
            0,
          ) /
            Math.max(
              1,
              data.waitTimeTrend.reduce((s, d) => s + d.sampleSize, 0),
            ),
        );

  const priorityPct = (() => {
    const priorities = data.priorityBreakdown.filter((p) => p.priorityType !== "NONE");
    const sum = priorities.reduce((s, p) => s + p.count, 0);
    return data.total ? Math.round((sum / data.total) * 100) : 0;
  })();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Tickets (7d)" value={data.total} tone="default" />
        <StatCard
          label="Avg wait"
          value={`${avgWaitOverall} min`}
          tone="default"
        />
        <StatCard
          label="Dropout rate"
          value={`${(data.dropoutRate * 100).toFixed(1)}%`}
          tone={data.dropoutRate > 0.15 ? "warn" : "default"}
          subline={`${data.dropouts} of ${data.total}`}
        />
        <StatCard
          label="Priority share"
          value={`${priorityPct}%`}
          tone="default"
          subline="PWD + Senior + Pregnant"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily average wait time</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.waitTimeTrend} margin={{ left: 4, right: 8, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="day"
                  tickFormatter={(v: string) => v.slice(5)}
                  fontSize={12}
                  stroke="#64748b"
                />
                <YAxis fontSize={12} stroke="#64748b" unit="m" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
                  formatter={(v) => [`${v} min`, "Avg wait"]}
                />
                <Line
                  type="monotone"
                  dataKey="averageWaitMinutes"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Arrivals by hour (7d)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.peakHours} margin={{ left: 4, right: 8, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="hour"
                  tickFormatter={(v: number) => `${v}h`}
                  fontSize={12}
                  stroke="#64748b"
                />
                <YAxis fontSize={12} stroke="#64748b" />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
                  formatter={(v) => [`${v}`, "Tickets"]}
                  labelFormatter={(h) => `${h}:00`}
                />
                <Bar dataKey="count" fill="#0f172a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Priority mix</CardTitle>
            <a href="/api/analytics/export">
              <Button variant="outline" size="sm">
                Export CSV
              </Button>
            </a>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.priorityBreakdown}
                  dataKey="count"
                  nameKey="priorityType"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {data.priorityBreakdown.map((p) => (
                    <Cell key={p.priorityType} fill={PRIORITY_COLORS[p.priorityType] ?? "#475569"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0" }}
                  formatter={(v, _name, item) => [
                    `${v}`,
                    (item as { payload?: { priorityType?: string } } | undefined)?.payload
                      ?.priorityType ?? "",
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subline,
  tone,
}: {
  label: string;
  value: string | number;
  subline?: string;
  tone: "default" | "warn";
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <p
          className={`text-3xl font-semibold mt-1 ${tone === "warn" ? "text-amber-600" : ""}`}
        >
          {value}
        </p>
        {subline && <p className="text-xs text-muted-foreground mt-1">{subline}</p>}
      </CardContent>
    </Card>
  );
}
