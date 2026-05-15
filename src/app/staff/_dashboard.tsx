"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type StaffQueueRow = {
  number: string;
  patientName: string;
  phone: string;
  priorityType: string;
  status: string;
  createdAt: string;
  calledAt: string | null;
};

export function StaffDashboard() {
  const [queue, setQueue] = useState<StaffQueueRow[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PRIORITY">("ALL");
  const [pending, setPending] = useState(false);

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

  async function act(path: string, body?: object) {
    setPending(true);
    await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    setPending(false);
  }

  const current = queue.find((t) => t.status === "CALLED" || t.status === "SERVING");
  const waiting = queue.filter((t) => t.status === "WAITING");
  const visible =
    filter === "PRIORITY" ? waiting.filter((t) => t.priorityType !== "NONE") : waiting;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border bg-white p-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Now Serving</p>
        {current ? (
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-3xl font-bold">{current.number}</p>
              <p className="text-sm text-muted-foreground">
                {current.patientName} ({current.priorityType})
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => act("/api/queue/complete")} disabled={pending}>
                Complete
              </Button>
              <Button
                variant="outline"
                onClick={() => act("/api/queue/skip")}
                disabled={pending}
              >
                Skip
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">Nobody called yet.</p>
        )}
        <div className="mt-4 flex gap-2">
          <Button onClick={() => act("/api/queue/next")} disabled={pending}>
            Call Next
          </Button>
        </div>
      </section>

      <section>
        <header className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Waiting ({waiting.length})</h2>
          <div className="flex gap-2 text-sm">
            <button
              className={`px-3 py-1 rounded border ${filter === "ALL" ? "bg-slate-900 text-white" : "bg-white"}`}
              onClick={() => setFilter("ALL")}
            >
              All
            </button>
            <button
              className={`px-3 py-1 rounded border ${filter === "PRIORITY" ? "bg-slate-900 text-white" : "bg-white"}`}
              onClick={() => setFilter("PRIORITY")}
            >
              Priority only
            </button>
          </div>
        </header>
        <ul className="flex flex-col gap-2">
          {visible.length === 0 && (
            <li className="text-sm text-muted-foreground">No waiting tickets.</li>
          )}
          {visible.map((t) => (
            <li
              key={t.number}
              className="flex items-center justify-between rounded-lg border bg-white p-3"
            >
              <div>
                <p className="font-mono font-semibold">{t.number}</p>
                <p className="text-sm text-muted-foreground">
                  {t.patientName}
                  {t.priorityType !== "NONE" && (
                    <span className="ml-2 text-amber-700">[{t.priorityType}]</span>
                  )}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => act("/api/queue/emergency", { ticketNumber: t.number })}
                disabled={pending}
              >
                Push to front
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
