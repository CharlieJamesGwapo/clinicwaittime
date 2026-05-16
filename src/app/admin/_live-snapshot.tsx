"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/lib/labels";

type Row = { number: string; status: string; priorityType: string };

export function LiveSnapshot() {
  const [queue, setQueue] = useState<Row[] | null>(null);

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

  if (queue === null) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-12 w-48" />
        </CardContent>
      </Card>
    );
  }

  const serving = queue.find((t) => t.status === "SERVING" || t.status === "CALLED");
  const waiting = queue.filter((t) => t.status === "WAITING");
  const priority = waiting.filter((t) => t.priorityType !== "NONE").length;

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/60 to-white">
      <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-700 font-medium">
              Now Serving
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p className="font-mono text-2xl sm:text-3xl font-bold">
                {serving?.number ?? "—"}
              </p>
              {serving && <StatusBadge status={serving.status} />}
            </div>
          </div>
          <div className="hidden sm:block w-px h-12 bg-blue-200" aria-hidden="true" />
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-medium inline-flex items-center gap-1">
              <Users className="h-3 w-3" aria-hidden="true" />
              Waiting
            </p>
            <p className="font-mono text-2xl sm:text-3xl font-bold tabular">
              {waiting.length}
            </p>
            {priority > 0 && (
              <p className="text-xs text-amber-700 mt-0.5">{priority} priority</p>
            )}
          </div>
        </div>
        <Link
          href="/admin/tickets"
          className="text-sm font-medium text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 cursor-pointer transition-colors"
        >
          View all tickets
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}
