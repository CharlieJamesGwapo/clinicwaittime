"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PriorityBadge, StatusBadge } from "@/lib/labels";
import * as offline from "@/lib/offline-queue";
import { OfflineBanner } from "./_offline";

type StaffQueueRow = {
  number: string;
  patientName: string;
  phone: string;
  priorityType: string;
  status: string;
  createdAt: string;
  calledAt: string | null;
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  return `${h}h${min % 60 ? ` ${min % 60}m` : ""} ago`;
}

export function StaffDashboard() {
  const [queue, setQueue] = useState<StaffQueueRow[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PRIORITY">("ALL");
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const res = await fetch("/api/queue", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setQueue(data.queue);
      } catch {
        /* retry */
      }
    };

    refresh();

    const es = new EventSource("/api/queue/stream");
    es.addEventListener("queue_updated", refresh);
    es.addEventListener("ready", refresh);

    return () => {
      cancelled = true;
      es.close();
    };
  }, []);

  async function act(label: string, path: string, body?: object) {
    setPending(label);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      offline.enqueue({ path, body });
      setPending(null);
      return;
    }
    try {
      await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      offline.enqueue({ path, body });
    }
    setPending(null);
  }

  const current = queue.find((t) => t.status === "CALLED" || t.status === "SERVING");
  const waiting = queue.filter((t) => t.status === "WAITING");
  const visible =
    filter === "PRIORITY" ? waiting.filter((t) => t.priorityType !== "NONE") : waiting;

  return (
    <div className="flex flex-col gap-6">
      <OfflineBanner />
      <Card className="border-2 border-blue-200 bg-blue-50/40">
        <CardContent className="pt-6">
          <p className="text-xs uppercase tracking-widest text-blue-700 font-medium">
            Now Serving
          </p>
          {current ? (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <p className="font-mono text-4xl font-bold">{current.number}</p>
                  <StatusBadge status={current.status} />
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  {current.patientName}
                  <PriorityBadgeInline priorityType={current.priorityType} />
                </p>
                {current.calledAt && (
                  <p className="text-xs text-slate-500 mt-1">
                    Called {timeAgo(current.calledAt)}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => act("complete", "/api/queue/complete")}
                  disabled={!!pending}
                >
                  {pending === "complete" ? "Completing…" : "Complete"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => act("skip", "/api/queue/skip")}
                  disabled={!!pending}
                >
                  Skip
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-slate-500">No active patient.</p>
              <Button
                onClick={() => act("next", "/api/queue/next")}
                disabled={!!pending || waiting.length === 0}
                size="lg"
              >
                {pending === "next" ? "Calling…" : "Call Next"}
              </Button>
            </div>
          )}
          {current && (
            <div className="mt-4 pt-4 border-t border-blue-100">
              <Button
                onClick={() => act("next", "/api/queue/next")}
                disabled={!!pending || waiting.length === 0}
              >
                {pending === "next" ? "Calling…" : "Complete & call next"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <section>
        <header className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Waiting ({waiting.length})</h2>
          <div className="flex gap-1 text-sm">
            <button
              className={`px-3 py-1.5 rounded-md border transition-colors ${filter === "ALL" ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50"}`}
              onClick={() => setFilter("ALL")}
            >
              All
            </button>
            <button
              className={`px-3 py-1.5 rounded-md border transition-colors ${filter === "PRIORITY" ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50"}`}
              onClick={() => setFilter("PRIORITY")}
            >
              Priority
            </button>
          </div>
        </header>

        {visible.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-slate-500">
              {waiting.length === 0
                ? "No one in line. ✓"
                : "No priority tickets right now."}
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {visible.map((t, idx) => (
              <li
                key={t.number}
                className="rounded-lg border bg-white p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="font-mono text-sm text-slate-400 w-6 text-right">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono font-semibold">{t.number}</p>
                      <PriorityBadge priorityType={t.priorityType} />
                    </div>
                    <p className="text-sm text-slate-600 truncate">
                      {t.patientName}
                    </p>
                    <p className="text-xs text-slate-400">
                      Waiting {timeAgo(t.createdAt)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => act(t.number, "/api/queue/emergency", { ticketNumber: t.number })}
                  disabled={!!pending}
                  className="w-full sm:w-auto"
                >
                  {pending === t.number ? "Bumping…" : "Push to front"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PriorityBadgeInline({ priorityType }: { priorityType: string }) {
  if (priorityType === "NONE") return null;
  return (
    <span className="ml-2 inline-block align-middle">
      <PriorityBadge priorityType={priorityType} />
    </span>
  );
}
