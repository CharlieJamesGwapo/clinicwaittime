"use client";

import { useEffect, useState } from "react";

type QueueRow = { number: string; status: string; priorityType: string };

export default function DisplayPage() {
  const [queue, setQueue] = useState<QueueRow[]>([]);

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

  const serving = queue.find((t) => t.status === "SERVING" || t.status === "CALLED");
  const waiting = queue.filter((t) => t.status === "WAITING").slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-900 text-slate-50 p-12 flex flex-col gap-12">
      <header className="text-center">
        <p className="text-xl uppercase tracking-widest text-slate-400">Now Serving</p>
        <p className="text-[10rem] font-bold leading-none mt-4">
          {serving ? serving.number : "—"}
        </p>
      </header>
      <section>
        <p className="text-lg uppercase tracking-widest text-slate-400 mb-4">Up Next</p>
        <ol className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => {
            const t = waiting[i];
            return (
              <li
                key={i}
                className="aspect-square rounded-xl bg-slate-800 flex flex-col items-center justify-center"
              >
                <p className="text-4xl font-bold">{t ? t.number : "—"}</p>
                {t && t.priorityType !== "NONE" && (
                  <p className="text-xs mt-2 text-amber-300">{t.priorityType}</p>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
