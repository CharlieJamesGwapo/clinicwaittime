"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare } from "lucide-react";

type Message = {
  id: string;
  ticketNumber: string;
  channel: "SMS" | "EMAIL";
  recipient: string;
  phone: string;
  message: string;
  sentAt: string;
};

type Tab = "ALL" | "SMS" | "EMAIL";

const TABS: { value: Tab; label: string; icon: React.ReactNode }[] = [
  { value: "ALL", label: "All", icon: null },
  { value: "SMS", label: "SMS", icon: <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" /> },
  { value: "EMAIL", label: "Email", icon: <Mail className="h-3.5 w-3.5" aria-hidden="true" /> },
];

function emailParts(message: string): { subject: string; body: string } | null {
  const m = message.match(/^Subject:\s*(.+?)\n\n([\s\S]*)$/);
  return m ? { subject: m[1].trim(), body: m[2] } : null;
}

export default function InboxPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [tab, setTab] = useState<Tab>("ALL");

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

  const filtered = useMemo(
    () => (tab === "ALL" ? messages : messages.filter((m) => m.channel === tab)),
    [messages, tab],
  );

  const counts = useMemo(
    () => ({
      ALL: messages.length,
      SMS: messages.filter((m) => m.channel === "SMS").length,
      EMAIL: messages.filter((m) => m.channel === "EMAIL").length,
    }),
    [messages],
  );

  return (
    <main id="main" className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-8 sm:py-12">
      <div className="max-w-md mx-auto">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
          ← Back
        </Link>
        <header className="mt-4 mb-4">
          <h1 className="text-2xl font-semibold">Notification inbox</h1>
          <p className="text-xs text-slate-500 mt-1">
            Every SMS and email the system would send appears here in real time —
            no real provider, no cost.
          </p>
        </header>

        <div className="flex gap-1 mb-3 rounded-lg bg-white p-1 border" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                tab === t.value
                  ? "bg-blue-700 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.icon}
              {t.label}
              <span
                className={`ml-1 text-xs ${tab === t.value ? "opacity-80" : "text-slate-400"}`}
              >
                {counts[t.value]}
              </span>
            </button>
          ))}
        </div>

        <div className="rounded-[2rem] bg-slate-900 p-3 shadow-2xl">
          <div className="rounded-[1.5rem] bg-white max-h-[70vh] overflow-y-auto p-4 flex flex-col gap-3">
            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-slate-400">No messages yet.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Check in a patient at /checkin to see one.
                </p>
              </div>
            )}
            {filtered.map((m) => {
              const isEmail = m.channel === "EMAIL";
              const parsed = isEmail ? emailParts(m.message) : null;
              return (
                <article
                  key={m.id}
                  className={`rounded-2xl border p-3 ${
                    isEmail
                      ? "bg-violet-50 border-violet-100"
                      : "bg-emerald-50 border-emerald-100"
                  }`}
                >
                  <header className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span className="inline-flex items-center gap-1 font-medium">
                      {isEmail ? (
                        <Mail className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <MessageSquare className="h-3 w-3" aria-hidden="true" />
                      )}
                      To {m.recipient || m.phone}
                    </span>
                    <time dateTime={m.sentAt}>
                      {new Date(m.sentAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </header>
                  {parsed ? (
                    <>
                      <p className="text-sm font-semibold text-slate-900">{parsed.subject}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                        {parsed.body}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm leading-relaxed text-slate-800">{m.message}</p>
                  )}
                  <footer className="mt-2 text-[10px] uppercase tracking-wide text-slate-400">
                    Ticket {m.ticketNumber}
                  </footer>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
