"use client";

import { useEffect, useState } from "react";

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
    <main className="min-h-screen p-8 flex flex-col items-center gap-4 bg-slate-50">
      <h1 className="text-2xl font-semibold">Simulated SMS inbox</h1>
      <p className="text-xs text-muted-foreground">
        Demo aid — every SMS the system would send appears here instead.
      </p>
      <div className="w-full max-w-md flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No messages yet.</p>
        )}
        {messages.map((m) => (
          <article key={m.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <header className="flex items-center justify-between text-xs text-muted-foreground">
              <span>To: {m.phone}</span>
              <time dateTime={m.sentAt}>{new Date(m.sentAt).toLocaleTimeString()}</time>
            </header>
            <p className="mt-2 text-sm">{m.message}</p>
            <footer className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
              Ticket {m.ticketNumber}
            </footer>
          </article>
        ))}
      </div>
    </main>
  );
}
