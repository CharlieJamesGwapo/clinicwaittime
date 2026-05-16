"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRIORITIES = [
  { value: "NONE", label: "None", desc: "Regular walk-in" },
  { value: "PWD", label: "PWD", desc: "Person with disability" },
  { value: "SENIOR", label: "Senior", desc: "60 years and older" },
  { value: "PREGNANT", label: "Pregnant", desc: "Expecting mother" },
];

export default function CheckinPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [priorityType, setPriorityType] = useState("NONE");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientName: name, phone, priorityType }),
    });
    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Request failed" }));
      setError(body.error ?? "Request failed");
      return;
    }
    const { ticket } = await res.json();
    router.push(`/q/${ticket.number}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-8 sm:py-16">
      <div className="max-w-md mx-auto">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back
        </Link>
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-2xl">Patient check-in</CardTitle>
            <p className="text-sm text-slate-500">
              We&apos;ll text you when you&apos;re almost up — feel free to wait outside.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aling Maria Cruz"
                  required
                  className="h-12 text-base"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+639171234567"
                  required
                  className="h-12 text-base"
                />
              </div>
              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm font-medium mb-1">Priority</legend>
                <div className="grid grid-cols-2 gap-2">
                  {PRIORITIES.map((p) => (
                    <label
                      key={p.value}
                      className={`rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                        priorityType === p.value
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="priorityType"
                        value={p.value}
                        checked={priorityType === p.value}
                        onChange={(e) => setPriorityType(e.target.value)}
                        className="sr-only"
                      />
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-xs text-slate-500">{p.desc}</p>
                    </label>
                  ))}
                </div>
              </fieldset>
              {error && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded p-2">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={pending} size="lg" className="h-12 text-base">
                {pending ? "Submitting…" : "Get my ticket"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
