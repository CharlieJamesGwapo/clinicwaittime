"use client";

import { useEffect, useState } from "react";
import * as queue from "@/lib/offline-queue";

export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [lastReplay, setLastReplay] = useState<{ ok: number; failed: number; kept: number } | null>(null);

  useEffect(() => {
    if (typeof navigator !== "undefined") setOnline(navigator.onLine);
    setPending(queue.list().length);

    const onOnline = async () => {
      setOnline(true);
      const result = await queue.replay();
      setPending(result.kept);
      setLastReplay(result);
      setTimeout(() => setLastReplay(null), 6000);
    };
    const onOffline = () => setOnline(false);
    const onStorage = () => setPending(queue.list().length);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("storage", onStorage);
    const poll = setInterval(() => setPending(queue.list().length), 2000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("storage", onStorage);
      clearInterval(poll);
    };
  }, []);

  if (online && pending === 0 && !lastReplay) return null;

  if (lastReplay) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm p-3 mb-4">
        Synced {lastReplay.ok} queued action{lastReplay.ok === 1 ? "" : "s"}
        {lastReplay.failed
          ? `, ${lastReplay.failed} rejected by server (discarded)`
          : ""}
        {lastReplay.kept
          ? `, ${lastReplay.kept} kept to retry`
          : ""}
        .
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm p-3 mb-4 flex items-center justify-between gap-2">
      <span>
        🔌 Offline — {pending} action{pending === 1 ? "" : "s"} queued for sync.
      </span>
      <span className="text-xs text-amber-700">Will replay when reconnected.</span>
    </div>
  );
}
