"use client";

import { useEffect, useState } from "react";
import { subscribeQueueUpdates } from "@/lib/subscribe-queue";

type QueueRow = { number: string; status: string; priorityType: string };

export default function DisplayPage() {
  const [queue, setQueue] = useState<QueueRow[]>([]);
  const [time, setTime] = useState(new Date());

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
    const unsubscribe = subscribeQueueUpdates(refresh);
    const clock = setInterval(() => setTime(new Date()), 1000);
    return () => {
      cancelled = true;
      unsubscribe();
      clearInterval(clock);
    };
  }, []);

  const serving = queue.find((t) => t.status === "SERVING" || t.status === "CALLED");
  const waiting = queue.filter((t) => t.status === "WAITING").slice(0, 5);

  return (
    <main id="main" className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-12 py-4 sm:py-6 border-b border-slate-800">
        <p className="text-sm sm:text-base uppercase tracking-widest text-slate-400">
          Clinic Wait-Time Tracker
        </p>
        <p className="text-sm sm:text-base font-mono text-slate-400">
          {time.toLocaleTimeString()}
        </p>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <p className="text-base sm:text-xl uppercase tracking-[0.3em] text-slate-400">
          Now Serving
        </p>
        <p
          className={`mt-4 font-bold leading-none tracking-tight transition-colors ${
            serving ? "text-emerald-300" : "text-slate-700"
          }`}
          style={{ fontSize: "clamp(6rem, 18vw, 14rem)" }}
        >
          {serving ? serving.number : "—"}
        </p>
        {serving && serving.priorityType !== "NONE" && (
          <p className="mt-2 text-amber-300 text-xl sm:text-2xl uppercase tracking-widest">
            {serving.priorityType} priority
          </p>
        )}
      </section>

      <section className="px-6 sm:px-12 pb-10">
        <p className="text-sm sm:text-base uppercase tracking-widest text-slate-400 mb-4">
          Up Next
        </p>
        <ol className="grid grid-cols-5 gap-2 sm:gap-4">
          {Array.from({ length: 5 }).map((_, i) => {
            const t = waiting[i];
            return (
              <li
                key={i}
                className="aspect-square rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center"
              >
                <p
                  className="font-bold font-mono"
                  style={{ fontSize: "clamp(1.25rem, 4vw, 3rem)" }}
                >
                  {t ? t.number : "—"}
                </p>
                {t && t.priorityType !== "NONE" && (
                  <p className="text-[10px] sm:text-xs mt-1 text-amber-300 uppercase tracking-widest">
                    {t.priorityType}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
