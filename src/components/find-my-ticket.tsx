"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FindMyTicket({
  label,
  placeholder,
  cta,
  notFound,
}: {
  label: string;
  placeholder: string;
  cta: string;
  notFound: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/ticket/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) {
        setError(notFound);
        return;
      }
      const { ticket } = await res.json();
      router.push(`/q/${ticket.number}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 max-w-md">
      <label htmlFor="find-ticket" className="text-xs font-medium text-slate-600 uppercase tracking-widest">
        {label}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
            aria-hidden="true"
          />
          <Input
            id="find-ticket"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="h-11 pl-9 text-base"
          />
        </div>
        <Button type="submit" disabled={pending || !query.trim()} className="h-11 cursor-pointer">
          {pending ? "…" : cta}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-rose-700">
          {error}
        </p>
      )}
    </form>
  );
}
