"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { CountUp } from "@/components/count-up";

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
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[0, 1, 2].map((i) => (
            <Card key={i} className={i === 2 ? "lg:col-span-2" : ""}>
              <CardContent className="pt-6 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-in">
        <StatCard
          label="Tickets (7d)"
          value={<CountUp value={data.total} />}
          tone="default"
        />
        <StatCard
          label="Avg wait"
          value={
            <>
              <CountUp value={avgWaitOverall} /> min
            </>
          }
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
          value={
            <>
              <CountUp value={priorityPct} />%
            </>
          }
          tone="default"
          subline="PWD + Senior + Pregnant"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Daily average wait time"
          srSummary={`Daily average wait time over the last 7 days. ${data.waitTimeTrend
            .map((d) => `${d.day}: ${d.averageWaitMinutes} minutes from ${d.sampleSize} tickets`)
            .join(". ")}.`}
          dataRows={data.waitTimeTrend.map((d) => ({
            label: d.day,
            value: `${d.averageWaitMinutes} min`,
            extra: `${d.sampleSize} tickets`,
          }))}
        >
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
                stroke="#1e40af"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Arrivals by hour (7d)"
          srSummary={`Ticket arrivals by hour of day. Peak hours: ${[...data.peakHours]
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .map((h) => `${h.hour}:00 with ${h.count} tickets`)
            .join(", ")}.`}
          dataRows={data.peakHours.map((h) => ({
            label: `${h.hour}:00`,
            value: `${h.count}`,
          }))}
        >
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
              <Bar dataKey="count" fill="#1e40af" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Priority mix"
          srSummary={`Priority breakdown of ${data.total} tickets. ${data.priorityBreakdown
            .map((p) => `${p.priorityType}: ${p.count} (${Math.round((p.count / data.total) * 100)}%)`)
            .join(", ")}.`}
          dataRows={data.priorityBreakdown.map((p) => ({
            label: p.priorityType,
            value: `${p.count}`,
            extra: data.total ? `${Math.round((p.count / data.total) * 100)}%` : "0%",
          }))}
          className="lg:col-span-2"
          action={
            <a href="/api/analytics/export">
              <Button variant="outline" size="sm" className="cursor-pointer">
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Export CSV
              </Button>
            </a>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.priorityBreakdown}
                dataKey="count"
                nameKey="priorityType"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                label={(entry) => {
                  const e = entry as unknown as { priorityType?: string; count?: number };
                  const pct = data.total && e.count != null ? Math.round((e.count / data.total) * 100) : 0;
                  return `${e.priorityType ?? ""} ${pct}%`;
                }}
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
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  srSummary,
  dataRows,
  children,
  className,
  action,
}: {
  title: string;
  srSummary: string;
  dataRows: { label: string; value: string; extra?: string }[];
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  const [showData, setShowData] = useState(false);
  return (
    <Card className={className} aria-label={title}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {action}
          <button
            type="button"
            onClick={() => setShowData((v) => !v)}
            className="text-xs text-slate-500 underline hover:text-slate-900 transition-colors"
            aria-expanded={showData}
          >
            {showData ? "Hide data" : "Show data"}
          </button>
        </div>
      </CardHeader>
      <CardContent className="h-64">
        <span className="sr-only">{srSummary}</span>
        {children}
      </CardContent>
      {showData && (
        <CardContent className="pt-0 max-h-48 overflow-y-auto border-t">
          <table className="w-full text-sm tabular">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="py-2 pr-2">Label</th>
                <th className="py-2 pr-2">Value</th>
                {dataRows.some((r) => r.extra) && <th className="py-2">Detail</th>}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((r) => (
                <tr key={r.label} className="border-t border-slate-100">
                  <td className="py-1.5 pr-2 font-mono">{r.label}</td>
                  <td className="py-1.5 pr-2 font-medium">{r.value}</td>
                  {r.extra !== undefined && (
                    <td className="py-1.5 text-slate-500">{r.extra}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      )}
    </Card>
  );
}

function StatCard({
  label,
  value,
  subline,
  tone,
}: {
  label: string;
  value: React.ReactNode;
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
