"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRIORITIES = [
  { value: "NONE", label: "None" },
  { value: "PWD", label: "PWD" },
  { value: "SENIOR", label: "Senior citizen" },
  { value: "PREGNANT", label: "Pregnant" },
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
    <main className="min-h-screen flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Patient check-in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone (e.g. +639171234567)</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium">Priority</legend>
              {PRIORITIES.map((p) => (
                <label key={p.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="priorityType"
                    value={p.value}
                    checked={priorityType === p.value}
                    onChange={(e) => setPriorityType(e.target.value)}
                  />
                  {p.label}
                </label>
              ))}
            </fieldset>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={pending}>
              {pending ? "Submitting…" : "Get my ticket"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
