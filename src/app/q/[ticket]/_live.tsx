"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { StatusBadge } from "@/lib/labels";
import {
  playChime,
  requestNotificationPermission,
  showCalledNotification,
} from "@/lib/notify-sound";

type Props = {
  number: string;
  initialStatus: string;
  initialPositionAhead: number;
  initialEstimatedWaitMinutes: number;
};

const STATUS_MESSAGE: Record<string, string> = {
  WAITING: "You're in the queue. We'll text you when you're almost up.",
  CALLED: "It's your turn! Please head to the consultation room.",
  SERVING: "You're being seen now.",
  DONE: "All done — thank you!",
  SKIPPED: "Marked as no-show. Please check in again at the desk.",
  DROPOUT: "Your ticket has expired. Please check in again.",
};

export function TicketStatusLive(props: Props) {
  const [status, setStatus] = useState(props.initialStatus);
  const [position, setPosition] = useState(props.initialPositionAhead);
  const [eta, setEta] = useState(props.initialEstimatedWaitMinutes);
  const [pulseKey, setPulseKey] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default",
  );
  const prevStatus = useRef(props.initialStatus);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
  }, []);

  useEffect(() => {
    if (status === prevStatus.current) return;
    const wasInactive =
      prevStatus.current === "WAITING" || prevStatus.current === "DONE";
    const becameCalled = status === "CALLED" || status === "SERVING";
    if (wasInactive && becameCalled && soundOn) {
      playChime();
      showCalledNotification(props.number).catch(() => {});
    }
    prevStatus.current = status;
    setPulseKey((k) => k + 1);
  }, [status, soundOn, props.number]);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const res = await fetch(`/api/ticket/${props.number}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setStatus(data.status);
        setPosition(data.positionAhead);
        setEta(data.estimatedWaitMinutes);
      } catch {
        /* retry next event */
      }
    };

    const es = new EventSource("/api/queue/stream");
    es.addEventListener("queue_updated", refresh);
    es.addEventListener("ready", refresh);

    return () => {
      cancelled = true;
      es.close();
    };
  }, [props.number]);

  const isActive = status === "WAITING" || status === "CALLED" || status === "SERVING";
  const isCalled = status === "CALLED" || status === "SERVING";

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <span key={pulseKey} className="inline-flex rounded-full badge-pulse">
        <StatusBadge status={status} />
      </span>

      {isActive && (
        <div className="w-full grid grid-cols-2 gap-3">
          <div
            className={`rounded-xl p-5 border ${isCalled ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"}`}
          >
            <p className="text-xs uppercase tracking-widest text-slate-500">Ahead of you</p>
            <p className="text-4xl font-semibold mt-1">{isCalled ? 0 : position}</p>
          </div>
          <div
            className={`rounded-xl p-5 border ${isCalled ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-200"}`}
          >
            <p className="text-xs uppercase tracking-widest text-slate-500">Est. wait</p>
            <p className="text-4xl font-semibold mt-1">
              {isCalled ? "Now" : `~${eta}m`}
            </p>
          </div>
        </div>
      )}

      <p
        className={`text-center text-sm sm:text-base ${
          isCalled ? "text-emerald-700 font-medium" : "text-slate-600"
        }`}
      >
        {STATUS_MESSAGE[status] ?? "Status updated."}
      </p>

      {permission !== "unsupported" && isActive && status === "WAITING" && (
        <button
          type="button"
          onClick={() => {
            const next = !soundOn;
            setSoundOn(next);
            if (next) {
              playChime();
              requestNotificationPermission();
              if (typeof window !== "undefined" && "Notification" in window) {
                setPermission(Notification.permission);
              }
            }
          }}
          className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          aria-pressed={soundOn}
        >
          {soundOn ? (
            <>
              <Bell className="h-3.5 w-3.5" aria-hidden="true" />
              Sound on — chime when called
            </>
          ) : (
            <>
              <BellOff className="h-3.5 w-3.5" aria-hidden="true" />
              Sound off
            </>
          )}
        </button>
      )}
    </div>
  );
}
