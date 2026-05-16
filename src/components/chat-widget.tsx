"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, Send, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
  { en: "How do I check in?", tl: "Paano mag-check-in?" },
  { en: "What counts as priority?", tl: "Ano ang priority?" },
  { en: "Will I get an SMS or email?", tl: "Makakatanggap ba ako ng SMS o email?" },
  { en: "Can I wait outside the clinic?", tl: "Pwede ba akong maghintay sa labas?" },
];

export function ChatWidget({ locale = "en" }: { locale?: "en" | "tl" }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function submit(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit(input);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        aria-expanded={open}
        className="fixed bottom-4 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg hover:bg-blue-800 transition-transform active:scale-95 cursor-pointer sm:bottom-6 sm:right-6"
      >
        {open ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
        )}
        {!open && messages.length === 0 && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Clinic assistant"
          className="fixed inset-x-0 bottom-0 z-30 flex flex-col bg-white shadow-2xl border-t sm:bottom-24 sm:right-6 sm:left-auto sm:w-[400px] sm:max-h-[600px] sm:h-[70vh] sm:rounded-2xl sm:border h-[85vh] fade-in"
        >
          <header className="flex items-center gap-3 px-4 py-3 border-b">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">Clinic Assistant</p>
              <p className="text-[11px] text-slate-500 leading-tight">
                {locale === "tl" ? "Para sa tanong sa klinika" : "Powered by Claude · clinic help"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="p-2 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-3 text-sm text-slate-700">
                  {locale === "tl"
                    ? "Kumusta! Pwede mo akong tanungin tungkol sa pila, pag-check-in, o paano gumagana ang notification."
                    : "Hi! Ask me about the queue, how to check in, or how notifications work."}
                </div>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => {
                    const text = locale === "tl" ? s.tl : s.en;
                    return (
                      <button
                        key={text}
                        type="button"
                        onClick={() => submit(text)}
                        className="text-left text-sm text-blue-700 bg-white border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        {text}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-blue-700 text-white"
                        : "bg-slate-100 text-slate-900"
                    }`}
                  >
                    {m.parts
                      .filter((p) => p.type === "text")
                      .map((p, i) => (
                        <span key={i}>{(p as { text: string }).text}</span>
                      ))}
                  </div>
                </div>
              ))
            )}
            {busy && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-600">
                  <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:hidden" aria-hidden="true" />
                  {locale === "tl" ? "Sandali lang…" : "Thinking…"}
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {locale === "tl"
                  ? "May problema. Subukan ulit."
                  : "Something went wrong. Please try again."}
              </div>
            )}
          </div>

          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 border-t p-3 bg-slate-50"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                locale === "tl"
                  ? "Magtanong tungkol sa klinika…"
                  : "Ask about the clinic…"
              }
              className="flex-1 h-10 rounded-md border bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              disabled={busy}
              aria-label="Message"
            />
            <Button
              type="submit"
              size="sm"
              disabled={busy || input.trim().length === 0}
              className="cursor-pointer h-10 px-3"
              aria-label="Send"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
