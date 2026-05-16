"use client";

import { useEffect, useState } from "react";

type QueueRow = { number: string; status: string };

export function LiveQueuePulse({ label }: { label: string }) {
  const [waiting, setWaiting] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const res = await fetch("/api/queue", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          const w = (data.queue as QueueRow[]).filter((t) => t.status === "WAITING").length;
          setWaiting(w);
        }
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

  if (waiting === null) return null;

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur px-3 py-1.5 text-xs font-medium border border-emerald-200 shadow-sm">
      <span className="relative inline-flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-slate-700">
        <strong className="tabular text-slate-900">{waiting}</strong> {label}
      </span>
    </div>
  );
}
