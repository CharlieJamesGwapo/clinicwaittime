"use client";

import { useEffect, useState } from "react";
import {
  PhoneCall,
  CheckCircle2,
  SkipForward,
  ArrowUp,
  Users,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PriorityBadge, StatusBadge } from "@/lib/labels";
import * as offline from "@/lib/offline-queue";
import { OfflineBanner } from "./_offline";

type StaffQueueRow = {
  number: string;
  patientName: string;
  phone: string;
  email: string | null;
  channel: string;
  priorityType: string;
  status: string;
  reason: string | null;
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
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "PRIORITY">("ALL");
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const res = await fetch("/api/queue", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setQueue(data.queue);
          setLoaded(true);
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

  const TOASTS: Record<string, { ok: string; err: string }> = {
    next: { ok: "Next patient called", err: "Couldn't call next" },
    complete: { ok: "Consultation marked complete", err: "Couldn't complete" },
    skip: { ok: "Patient skipped — next called", err: "Couldn't skip" },
  };

  async function act(label: string, path: string, body?: object) {
    setPending(label);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      offline.enqueue({ path, body });
      toast.info("Offline — action queued", {
        description: "Will sync when reconnected.",
      });
      setPending(null);
      return;
    }
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) {
        const t = TOASTS[label];
        if (t) toast.success(t.ok);
        else if (label.startsWith("A-") || label.startsWith("B-")) {
          toast.success(`Ticket ${label} pushed to front`);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        const t = TOASTS[label];
        toast.error(data.error ?? t?.err ?? "Action failed");
      }
    } catch {
      offline.enqueue({ path, body });
      toast.info("Offline — action queued");
    }
    setPending(null);
  }

  const current = queue.find((t) => t.status === "CALLED" || t.status === "SERVING");
  const waiting = queue.filter((t) => t.status === "WAITING");
  const visible =
    filter === "PRIORITY" ? waiting.filter((t) => t.priorityType !== "NONE") : waiting;

  if (!loaded) {
    return (
      <div className="flex flex-col gap-6">
        <OfflineBanner />
        <Card className="border-2 border-blue-200 bg-blue-50/40">
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

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
                {current.reason && (
                  <div className="mt-2 rounded-md bg-white border border-blue-200 p-2">
                    <p className="text-[10px] uppercase tracking-widest text-blue-700 font-medium">
                      Reason for visit
                    </p>
                    <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">
                      {current.reason}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => act("complete", "/api/queue/complete")}
                  disabled={!!pending}
                  className="cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {pending === "complete" ? "Completing…" : "Complete"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => act("skip", "/api/queue/skip")}
                  disabled={!!pending}
                  className="cursor-pointer"
                >
                  <SkipForward className="h-4 w-4" aria-hidden="true" />
                  Skip
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users className="h-4 w-4" aria-hidden="true" />
                No active patient.
              </div>
              <Button
                onClick={() => act("next", "/api/queue/next")}
                disabled={!!pending || waiting.length === 0}
                size="lg"
                className="cursor-pointer"
              >
                <PhoneCall className="h-4 w-4" aria-hidden="true" />
                {pending === "next" ? "Calling…" : "Call Next"}
              </Button>
            </div>
          )}
          {current && (
            <div className="mt-4 pt-4 border-t border-blue-100">
              <Button
                onClick={() => act("next", "/api/queue/next")}
                disabled={!!pending || waiting.length === 0}
                className="cursor-pointer"
              >
                <PhoneCall className="h-4 w-4" aria-hidden="true" />
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
            <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
              <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-slate-700">
                {waiting.length === 0 ? "Queue clear" : "No priority tickets"}
              </p>
              <p className="text-xs text-slate-500 max-w-[36ch]">
                {waiting.length === 0
                  ? "Nobody waiting. New check-ins will show up here automatically."
                  : "Switch the filter to All to see regular waiting tickets."}
              </p>
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
                    {t.reason && (
                      <p
                        className="text-xs text-slate-500 mt-0.5 line-clamp-1 inline-flex items-center gap-1"
                        title={t.reason}
                      >
                        <FileText className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">{t.reason}</span>
                      </p>
                    )}
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
                  className="w-full sm:w-auto cursor-pointer"
                >
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
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
