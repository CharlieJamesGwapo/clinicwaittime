"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SmsMessage = {
  id: string;
  ticketNumber: string;
  phone: string;
  message: string;
  sentAt: string;
};

export default function SmsInboxPage() {
  const [messages, setMessages] = useState<SmsMessage[]>([]);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const res = await fetch("/api/sms-log", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setMessages(data.messages);
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-8 sm:py-12">
      <div className="max-w-md mx-auto">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back
        </Link>
        <header className="mt-4 mb-4">
          <h1 className="text-2xl font-semibold">Simulated SMS inbox</h1>
          <p className="text-xs text-slate-500 mt-1">
            Every SMS the system would send appears here in real time —
            no real SMS provider, no cost.
          </p>
        </header>

        <div className="rounded-[2rem] bg-slate-900 p-3 shadow-2xl">
          <div className="rounded-[1.5rem] bg-white max-h-[70vh] overflow-y-auto p-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-400">No messages yet.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Check in a patient at /checkin to see one.
                </p>
              </div>
            )}
            {messages.map((m) => (
              <article
                key={m.id}
                className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3"
              >
                <header className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                  <span className="font-medium">To {m.phone}</span>
                  <time dateTime={m.sentAt}>
                    {new Date(m.sentAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </header>
                <p className="text-sm leading-relaxed text-slate-800">{m.message}</p>
                <footer className="mt-2 text-[10px] uppercase tracking-wide text-slate-400">
                  Ticket {m.ticketNumber}
                </footer>
              </article>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
