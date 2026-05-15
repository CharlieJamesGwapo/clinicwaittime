# Clinic Wait-Time Tracker — Phase 2 (Patient Flow + Simulated SMS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Patients can walk in, scan a QR, check in via `/checkin`, land on their live `/q/[ticket]` status page, and an in-app simulated SMS lands in `/demo/sms-inbox` — all without touching the staff dashboard yet.

**Architecture:** Three new public pages (`/checkin`, `/q/[ticket]`, `/demo/sms-inbox`) plus three new API routes (`POST /api/checkin`, `GET /api/ticket/[number]`, `GET /api/sms-log`). Live updates on `/q/[ticket]` and `/demo/sms-inbox` use simple 2-second client polling — SSE moves in during Phase 3 once the staff dashboard is the source of mutations. Pure logic (ticket numbering, predictor, SMS templating, queue position) is unit-tested with Vitest; routes and pages are verified end-to-end with curl + dev server, matching Phase 1's style.

**Tech Stack additions:** `qrcode` (poster generation). Everything else carries over from Phase 1.

**Working directory:** `/Users/a1234/Desktop/michael_lee`

**Reference spec:** `docs/superpowers/specs/2026-05-15-clinic-wait-time-tracker-design.md` — sections §5, §6, §7, §8.2, §8.3.

**Phase boundary clarifications (spec gaps resolved here):**

- The spec's `PriorityType` and `TicketStatus` are enums; Phase 1 already stored them as SQLite-friendly strings. Phase 2 continues that — constants live in `src/lib/types.ts`.
- The spec says "the patient's chosen locale at check-in is recorded on the ticket," but the schema in §6 has no locale field. i18n is Phase 5, so we postpone the column and only emit English SMS in Phase 2. A small Prisma migration in Phase 5 adds `locale` to `Ticket`.
- §8.1 priority-window ordering is Phase 3 (staff dashboard needs it). Phase 2 ships a simple FIFO `ticketPosition` helper in `src/lib/queue.ts`; Phase 3 replaces the body without changing the signature.
- §8.2 predictor lives behind an interface now so Phase 3 can swap in the rolling-average implementation without rewriting callers.

---

## File Structure (created across the tasks below)

```
src/lib/types.ts                       # TicketStatus / PriorityType / Locale string unions
src/lib/ticket-number.ts               # next ticket number generator (daily reset)
src/lib/queue.ts                       # ticketPosition(ticketId) — FIFO stub
src/lib/predictor.ts                   # WaitTimePredictor interface + heuristic impl
src/lib/sms-templates.ts               # render check-in / 2-away / your-turn SMS bodies
src/lib/sms.ts                         # writeSmsLog DB helper

src/lib/__tests__/ticket-number.test.ts
src/lib/__tests__/predictor.test.ts
src/lib/__tests__/sms-templates.test.ts

src/app/api/checkin/route.ts           # POST — create ticket + check-in SmsLog
src/app/api/ticket/[number]/route.ts   # GET — patient ticket status
src/app/api/sms-log/route.ts           # GET — feed for /demo/sms-inbox

src/app/checkin/page.tsx               # patient walk-in form (client)
src/app/q/[ticket]/page.tsx            # patient queue status (server + 2s client refresh)
src/app/demo/sms-inbox/page.tsx        # simulated SMS feed (2s client refresh)

scripts/generate-qr-poster.ts          # one-off: writes public/checkin-qr.png
public/checkin-qr.png                  # generated, gitignored OR committed (choose in Task 9)
```

`src/app/page.tsx` is updated so the existing `/checkin` link no longer dead-ends.

---

## Task 1: Install Phase 2 dependencies

**Files modified:** `package.json`, `package-lock.json`

- [ ] **Step 1: Install qrcode**

```bash
npm install qrcode
npm install -D @types/qrcode
```

- [ ] **Step 2: Verify install**

```bash
node -e "require('qrcode')" && echo "ok"
```

Expected: `ok`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(phase-2): add qrcode dep for QR poster generation"
```

---

## Task 2: Ticket number generator (TDD)

**Files:**
- Create: `src/lib/ticket-number.ts`, `src/lib/__tests__/ticket-number.test.ts`

Format: `A-001`, `A-002`, … resetting at midnight local time. Letter advances `A → B → …` only if a single day exceeds 999 tickets (won't happen in demo, but the contract is defined).

- [ ] **Step 1: Write the failing test**

`src/lib/__tests__/ticket-number.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatTicketNumber } from "@/lib/ticket-number";

describe("formatTicketNumber", () => {
  it("formats sequence 1 as A-001", () => {
    expect(formatTicketNumber(1)).toBe("A-001");
  });

  it("formats sequence 42 as A-042", () => {
    expect(formatTicketNumber(42)).toBe("A-042");
  });

  it("formats sequence 999 as A-999", () => {
    expect(formatTicketNumber(999)).toBe("A-999");
  });

  it("rolls over to B-001 at sequence 1000", () => {
    expect(formatTicketNumber(1000)).toBe("B-001");
  });
});
```

Run: `npm test` → FAIL (module missing).

- [ ] **Step 2: Implement**

`src/lib/ticket-number.ts`:

```ts
import { db } from "@/lib/db";

const PER_LETTER = 1000;

export function formatTicketNumber(sequence: number): string {
  const letterIndex = Math.floor((sequence - 1) / PER_LETTER);
  const letter = String.fromCharCode("A".charCodeAt(0) + letterIndex);
  const within = ((sequence - 1) % PER_LETTER) + 1;
  return `${letter}-${String(within).padStart(3, "0")}`;
}

export async function nextTicketNumber(now: Date = new Date()): Promise<string> {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const todayCount = await db.ticket.count({
    where: { createdAt: { gte: startOfDay } },
  });
  return formatTicketNumber(todayCount + 1);
}
```

(Only `formatTicketNumber` is unit-tested — it's pure. `nextTicketNumber` hits the DB and will be exercised by route-level curl smoke tests in Task 7.)

Run: `npm test` → PASS (4 tests).

- [ ] **Step 3: Commit**

```bash
git add src/lib/ticket-number.ts src/lib/__tests__/ticket-number.test.ts
git commit -m "feat(phase-2): add ticket-number generator with daily reset"
```

---

## Task 3: Predictor stub (TDD)

**Files:**
- Create: `src/lib/predictor.ts`, `src/lib/__tests__/predictor.test.ts`

Per spec §8.2, the predictor must live behind an interface so Phase 3 can swap in a rolling-average implementation. Phase 2 ships a simple wrapper around `default_consultation_minutes` from `Setting`.

- [ ] **Step 1: Write the failing test**

`src/lib/__tests__/predictor.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { HeuristicPredictor } from "@/lib/predictor";

describe("HeuristicPredictor.estimateMinutes", () => {
  const predictor = new HeuristicPredictor({ defaultConsultationMinutes: 15 });

  it("returns 0 when no one is ahead", () => {
    expect(predictor.estimateMinutes({ positionAhead: 0 })).toBe(0);
  });

  it("multiplies position by default consultation minutes", () => {
    expect(predictor.estimateMinutes({ positionAhead: 4 })).toBe(60);
  });

  it("uses rolling average when historical samples are provided", () => {
    const p = new HeuristicPredictor({ defaultConsultationMinutes: 15 });
    expect(
      p.estimateMinutes({ positionAhead: 3, recentConsultationMinutes: [10, 20, 30] })
    ).toBe(60); // mean(10,20,30) = 20, 20*3 = 60
  });

  it("falls back to default when fewer than 5 samples are provided", () => {
    const p = new HeuristicPredictor({ defaultConsultationMinutes: 15 });
    expect(
      p.estimateMinutes({ positionAhead: 2, recentConsultationMinutes: [9, 9, 9, 9] })
    ).toBe(30); // 4 samples, still falls back to default 15*2 = 30
  });
});
```

Run: `npm test` → FAIL.

- [ ] **Step 2: Implement**

`src/lib/predictor.ts`:

```ts
export interface WaitTimePredictor {
  estimateMinutes(input: PredictorInput): number;
}

export interface PredictorInput {
  positionAhead: number;
  /** mean(completedAt - calledAt) of last 20 DONE tickets, in minutes. */
  recentConsultationMinutes?: number[];
}

const MIN_SAMPLES = 5;

export class HeuristicPredictor implements WaitTimePredictor {
  constructor(private readonly cfg: { defaultConsultationMinutes: number }) {}

  estimateMinutes({ positionAhead, recentConsultationMinutes }: PredictorInput): number {
    const samples = recentConsultationMinutes ?? [];
    const avg =
      samples.length >= MIN_SAMPLES
        ? samples.reduce((a, b) => a + b, 0) / samples.length
        : this.cfg.defaultConsultationMinutes;
    return Math.round(positionAhead * avg);
  }
}
```

Run: `npm test` → PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/predictor.ts src/lib/__tests__/predictor.test.ts
git commit -m "feat(phase-2): add WaitTimePredictor interface + heuristic impl"
```

---

## Task 4: SMS templates (TDD)

**Files:**
- Create: `src/lib/sms-templates.ts`, `src/lib/__tests__/sms-templates.test.ts`

Per spec §8.3 there are three SMS triggers. Phase 2 only fires `checkin` (the others trigger from staff actions in Phase 3), but we ship all three template renderers now so Phase 3 just calls them.

- [ ] **Step 1: Write the failing test**

`src/lib/__tests__/sms-templates.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { renderSms } from "@/lib/sms-templates";

describe("renderSms", () => {
  const ctx = {
    name: "Aling Maria",
    ticketNumber: "A-042",
    statusUrl: "https://clinic.test/q/A-042",
    estimatedWaitMinutes: 45,
  };

  it("renders the check-in confirmation in English", () => {
    expect(renderSms("checkin", ctx)).toBe(
      "Hi Aling Maria, you're ticket A-042. Estimated wait: 45 min. Track status: https://clinic.test/q/A-042"
    );
  });

  it("renders the 2-slots-away message", () => {
    expect(renderSms("almost", ctx)).toBe(
      "Ticket A-042 — please return to the clinic. You will be called soon."
    );
  });

  it("renders the your-turn message", () => {
    expect(renderSms("your-turn", ctx)).toBe(
      "Ticket A-042 — please proceed to consultation now."
    );
  });
});
```

Run: `npm test` → FAIL.

- [ ] **Step 2: Implement**

`src/lib/sms-templates.ts`:

```ts
export type SmsKind = "checkin" | "almost" | "your-turn";

export interface SmsContext {
  name: string;
  ticketNumber: string;
  statusUrl: string;
  estimatedWaitMinutes: number;
}

export function renderSms(kind: SmsKind, ctx: SmsContext): string {
  switch (kind) {
    case "checkin":
      return `Hi ${ctx.name}, you're ticket ${ctx.ticketNumber}. Estimated wait: ${ctx.estimatedWaitMinutes} min. Track status: ${ctx.statusUrl}`;
    case "almost":
      return `Ticket ${ctx.ticketNumber} — please return to the clinic. You will be called soon.`;
    case "your-turn":
      return `Ticket ${ctx.ticketNumber} — please proceed to consultation now.`;
  }
}
```

Run: `npm test` → PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/sms-templates.ts src/lib/__tests__/sms-templates.test.ts
git commit -m "feat(phase-2): add SMS template renderer (checkin/almost/your-turn)"
```

---

## Task 5: Queue position helper + types + sms writer

**Files:**
- Create: `src/lib/types.ts`, `src/lib/queue.ts`, `src/lib/sms.ts`

No tests — these are thin wrappers around DB calls; they're exercised by the route smoke tests in Tasks 7–9.

- [ ] **Step 1: Create the string-union types**

`src/lib/types.ts`:

```ts
export const PRIORITY_TYPES = ["NONE", "PWD", "SENIOR", "PREGNANT"] as const;
export type PriorityType = (typeof PRIORITY_TYPES)[number];

export const TICKET_STATUSES = ["WAITING", "CALLED", "SERVING", "DONE", "SKIPPED", "DROPOUT"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export function isPriorityType(v: unknown): v is PriorityType {
  return typeof v === "string" && (PRIORITY_TYPES as readonly string[]).includes(v);
}
```

- [ ] **Step 2: Create the position helper**

`src/lib/queue.ts`:

```ts
import { db } from "@/lib/db";

/**
 * Phase 2: simple FIFO — count of WAITING tickets created before this one.
 * Phase 3 replaces the body with the priority-window logic from spec §8.1.
 * The signature stays the same.
 */
export async function ticketPosition(ticketNumber: string): Promise<number> {
  const ticket = await db.ticket.findUnique({ where: { number: ticketNumber } });
  if (!ticket) return -1;
  if (ticket.status !== "WAITING") return 0;
  return db.ticket.count({
    where: {
      status: "WAITING",
      createdAt: { lt: ticket.createdAt },
    },
  });
}
```

- [ ] **Step 3: Create the SMS writer**

`src/lib/sms.ts`:

```ts
import { db } from "@/lib/db";

export async function writeSmsLog(input: {
  ticketId: string;
  phone: string;
  message: string;
}): Promise<void> {
  await db.smsLog.create({
    data: {
      ticketId: input.ticketId,
      phone: input.phone,
      message: input.message,
    },
  });
}
```

- [ ] **Step 4: Verify build still passes**

```bash
npm run build && npm test
```

Expected: build green, all 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/lib/queue.ts src/lib/sms.ts
git commit -m "feat(phase-2): add types, queue position helper, and SMS writer"
```

---

## Task 6: POST /api/checkin

**Files:**
- Create: `src/app/api/checkin/route.ts`

Body schema: `{ patientName: string, phone: string, priorityType: PriorityType }`.

Response: `{ ticket: { number, patientName, phone, priorityType, status, createdAt } }` on 201, `{ error: string }` on 400.

Side effects: creates a `Ticket` row, calls `renderSms("checkin", …)`, writes the row via `writeSmsLog`.

- [ ] **Step 1: Write the route**

`src/app/api/checkin/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { nextTicketNumber } from "@/lib/ticket-number";
import { ticketPosition } from "@/lib/queue";
import { HeuristicPredictor } from "@/lib/predictor";
import { renderSms } from "@/lib/sms-templates";
import { writeSmsLog } from "@/lib/sms";
import { isPriorityType } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const patientName = typeof body.patientName === "string" ? body.patientName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const priorityType = isPriorityType(body.priorityType) ? body.priorityType : "NONE";

  if (!patientName) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "Phone is required" }, { status: 400 });

  const number = await nextTicketNumber();
  const ticket = await db.ticket.create({
    data: { number, patientName, phone, priorityType },
  });

  const positionAhead = await ticketPosition(number);
  const defaultMins = Number(
    (await db.setting.findUnique({ where: { key: "default_consultation_minutes" } }))?.value ?? 15
  );
  const predictor = new HeuristicPredictor({ defaultConsultationMinutes: defaultMins });
  const eta = predictor.estimateMinutes({ positionAhead });

  const origin = req.nextUrl.origin;
  const statusUrl = `${origin}/q/${number}`;
  const message = renderSms("checkin", {
    name: patientName,
    ticketNumber: number,
    statusUrl,
    estimatedWaitMinutes: eta,
  });
  await writeSmsLog({ ticketId: ticket.id, phone, message });

  return NextResponse.json({ ticket }, { status: 201 });
}
```

- [ ] **Step 2: Smoke-test via curl**

```bash
npm run dev > /tmp/dev.log 2>&1 &
sleep 4

curl -si -X POST http://localhost:3000/api/checkin \
  -H "Content-Type: application/json" \
  -d '{"patientName":"Aling Maria","phone":"+639171234567","priorityType":"SENIOR"}' \
  | head -20

# Verify a SmsLog row was created
node -e "const{PrismaClient}=require('@prisma/client');const d=new PrismaClient();d.smsLog.findMany().then(rs=>{console.log('sms rows:',rs.length);console.log(rs[0]?.message);return d.\$disconnect()})"

pkill -f "next dev"
```

Expected: `201 Created` with a ticket JSON, and an SmsLog row whose message begins with `Hi Aling Maria, you're ticket A-001.`

Also test bad input:

```bash
curl -si -X POST http://localhost:3000/api/checkin \
  -H "Content-Type: application/json" \
  -d '{"patientName":"","phone":"+639171234567"}'
```

Expected: `400 Bad Request` with `{"error":"Name is required"}`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/checkin
git commit -m "feat(phase-2): POST /api/checkin creates ticket + check-in SmsLog"
```

---

## Task 7: GET /api/ticket/[number] and GET /api/sms-log

**Files:**
- Create: `src/app/api/ticket/[number]/route.ts`, `src/app/api/sms-log/route.ts`

These power the patient status page and the demo inbox respectively.

- [ ] **Step 1: Write the ticket-lookup route**

`src/app/api/ticket/[number]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ticketPosition } from "@/lib/queue";
import { HeuristicPredictor } from "@/lib/predictor";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;
  const ticket = await db.ticket.findUnique({ where: { number } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const positionAhead = await ticketPosition(number);
  const defaultMins = Number(
    (await db.setting.findUnique({ where: { key: "default_consultation_minutes" } }))?.value ?? 15
  );
  const eta = new HeuristicPredictor({ defaultConsultationMinutes: defaultMins }).estimateMinutes({
    positionAhead,
  });

  return NextResponse.json({
    number: ticket.number,
    patientName: ticket.patientName,
    status: ticket.status,
    priorityType: ticket.priorityType,
    positionAhead,
    estimatedWaitMinutes: eta,
    createdAt: ticket.createdAt,
  });
}
```

(Next.js 16 makes route `params` a Promise; this is required.)

- [ ] **Step 2: Write the SMS feed route**

`src/app/api/sms-log/route.ts`:

```ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const rows = await db.smsLog.findMany({
    orderBy: { sentAt: "desc" },
    take: 50,
    include: { ticket: { select: { number: true } } },
  });
  return NextResponse.json({
    messages: rows.map((r) => ({
      id: r.id,
      ticketNumber: r.ticket.number,
      phone: r.phone,
      message: r.message,
      sentAt: r.sentAt,
    })),
  });
}
```

- [ ] **Step 3: Smoke-test both**

```bash
npm run dev > /tmp/dev.log 2>&1 &
sleep 4

# Assuming a ticket exists from Task 6
curl -s http://localhost:3000/api/ticket/A-001 | head -1
curl -s http://localhost:3000/api/sms-log | head -1

pkill -f "next dev"
```

Expected: ticket JSON with `positionAhead`, `estimatedWaitMinutes`; sms-log JSON with at least one message.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/ticket src/app/api/sms-log
git commit -m "feat(phase-2): add ticket lookup and SMS log API routes"
```

---

## Task 8: /checkin page

**Files:**
- Create: `src/app/checkin/page.tsx`

Client component. Fields: name, phone, priorityType (radio: None / PWD / Senior / Pregnant). On submit, POST `/api/checkin`, then `router.push("/q/" + result.ticket.number)`.

- [ ] **Step 1: Build the form**

`src/app/checkin/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Update landing link target (no /checkin 404 anymore)**

(`src/app/page.tsx` already links to `/checkin` from Phase 1 Task 1 — verify by loading `/` and confirming the link no longer 404s.)

- [ ] **Step 3: Smoke-test**

```bash
npm run dev > /tmp/dev.log 2>&1 &
sleep 4
curl -s http://localhost:3000/checkin | grep -oE "(Patient check-in|Priority)" | sort -u
pkill -f "next dev"
```

Expected: both strings present.

- [ ] **Step 4: Commit**

```bash
git add src/app/checkin
git commit -m "feat(phase-2): add /checkin patient walk-in form"
```

---

## Task 9: /q/[ticket] page with live refresh

**Files:**
- Create: `src/app/q/[ticket]/page.tsx`

Server component fetches the initial state directly from the DB, then a tiny client island polls `/api/ticket/[number]` every 2 seconds for updates. Phase 3 will replace polling with an `EventSource` subscription.

- [ ] **Step 1: Build the page**

`src/app/q/[ticket]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ticketPosition } from "@/lib/queue";
import { HeuristicPredictor } from "@/lib/predictor";
import { TicketStatusLive } from "./_live";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ ticket: string }>;
}) {
  const { ticket: number } = await params;
  const ticket = await db.ticket.findUnique({ where: { number } });
  if (!ticket) notFound();

  const positionAhead = await ticketPosition(number);
  const defaultMins = Number(
    (await db.setting.findUnique({ where: { key: "default_consultation_minutes" } }))?.value ?? 15
  );
  const eta = new HeuristicPredictor({ defaultConsultationMinutes: defaultMins }).estimateMinutes({
    positionAhead,
  });

  return (
    <main className="min-h-screen p-8 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-semibold">Ticket {ticket.number}</h1>
      <p>{ticket.patientName}</p>
      <TicketStatusLive
        number={ticket.number}
        initialStatus={ticket.status}
        initialPositionAhead={positionAhead}
        initialEstimatedWaitMinutes={eta}
      />
      <p className="text-xs text-muted-foreground">
        Updates automatically — keep this page open.
      </p>
    </main>
  );
}
```

`src/app/q/[ticket]/_live.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

type Props = {
  number: string;
  initialStatus: string;
  initialPositionAhead: number;
  initialEstimatedWaitMinutes: number;
};

export function TicketStatusLive(props: Props) {
  const [status, setStatus] = useState(props.initialStatus);
  const [position, setPosition] = useState(props.initialPositionAhead);
  const [eta, setEta] = useState(props.initialEstimatedWaitMinutes);

  useEffect(() => {
    const tick = async () => {
      try {
        const res = await fetch(`/api/ticket/${props.number}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setStatus(data.status);
        setPosition(data.positionAhead);
        setEta(data.estimatedWaitMinutes);
      } catch {
        /* swallow — try again next tick */
      }
    };
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [props.number]);

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-2xl">Status: <strong>{status}</strong></p>
      <p>{position} ticket(s) ahead of you</p>
      <p>Estimated wait: ~{eta} min</p>
    </div>
  );
}
```

- [ ] **Step 2: Smoke-test**

```bash
npm run dev > /tmp/dev.log 2>&1 &
sleep 4
curl -s http://localhost:3000/q/A-001 | grep -oE "(Ticket A-001|Status:|ticket\(s\) ahead)" | sort -u
pkill -f "next dev"
```

Expected: all three substrings present (HTML contains the server-rendered initial state).

- [ ] **Step 3: Commit**

```bash
git add src/app/q
git commit -m "feat(phase-2): add /q/[ticket] page with 2s live status polling"
```

---

## Task 10: /demo/sms-inbox page

**Files:**
- Create: `src/app/demo/sms-inbox/page.tsx`

Phone-shaped panel showing the newest SMS at top, polled every 2s. Public — no auth.

- [ ] **Step 1: Build the page**

`src/app/demo/sms-inbox/page.tsx`:

```tsx
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
    const tick = async () => {
      try {
        const res = await fetch("/api/sms-log", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setMessages(data.messages);
      } catch {
        /* retry next tick */
      }
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
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
```

- [ ] **Step 2: Smoke-test**

Run the dev server, open `/demo/sms-inbox`. Then in another terminal:

```bash
curl -s -X POST http://localhost:3000/api/checkin \
  -H "Content-Type: application/json" \
  -d '{"patientName":"Test Patient","phone":"+639171234999","priorityType":"NONE"}'
```

The inbox should display the new SMS within 2 seconds.

- [ ] **Step 3: Commit**

```bash
git add src/app/demo
git commit -m "feat(phase-2): add /demo/sms-inbox simulated SMS feed"
```

---

## Task 11: QR poster generator script

**Files:**
- Create: `scripts/generate-qr-poster.ts`, `public/checkin-qr.png` (output)
- Modify: `package.json` (add `qr:poster` script)

One-off Node script that emits a PNG pointing to `https://<host>/checkin`. The poster's host comes from an arg or defaults to `http://localhost:3000` for local testing.

- [ ] **Step 1: Write the script**

`scripts/generate-qr-poster.ts`:

```ts
import QRCode from "qrcode";
import path from "node:path";

const host = process.argv[2] ?? "http://localhost:3000";
const url = `${host.replace(/\/$/, "")}/checkin`;
const out = path.resolve(__dirname, "..", "public", "checkin-qr.png");

QRCode.toFile(out, url, { width: 600, margin: 2 }).then(() => {
  console.log(`Wrote ${out}`);
  console.log(`Target URL: ${url}`);
});
```

- [ ] **Step 2: Add the script to package.json**

In `"scripts"`:

```json
"qr:poster": "tsx scripts/generate-qr-poster.ts"
```

- [ ] **Step 3: Run it**

```bash
npm run qr:poster
```

Expected: `Wrote …/public/checkin-qr.png` and a 600x600 PNG appears.

- [ ] **Step 4: Commit (commit the PNG so a fresh clone has the demo poster)**

```bash
git add scripts/generate-qr-poster.ts public/checkin-qr.png package.json
git commit -m "feat(phase-2): add QR poster generator and demo poster image"
```

---

## Task 12: Final verification + tag

- [ ] **Step 1: Reset the database**

To get a clean slate for the demo, wipe and re-seed:

```bash
rm prisma/dev.db
npx prisma migrate deploy
npm run db:seed
```

- [ ] **Step 2: Build + unit tests**

```bash
npm run build && npm test
```

Expected: build green; all 10 tests pass (3 from Phase 1, 4 from Task 2, 4 from Task 3, 3 from Task 4 = 14 — adjust this count check based on actual after Task 4 lands).

- [ ] **Step 3: End-to-end smoke**

```bash
npm run dev > /tmp/dev.log 2>&1 &
sleep 4

# 1. Walk-in
curl -si -X POST http://localhost:3000/api/checkin \
  -H "Content-Type: application/json" \
  -d '{"patientName":"Aling Maria","phone":"+639171234567","priorityType":"SENIOR"}' | head -3

# 2. Add two more so position math is meaningful
curl -s -X POST http://localhost:3000/api/checkin -H "Content-Type: application/json" \
  -d '{"patientName":"Mang Tino","phone":"+639171110001","priorityType":"NONE"}' > /dev/null
curl -s -X POST http://localhost:3000/api/checkin -H "Content-Type: application/json" \
  -d '{"patientName":"Lola Pacing","phone":"+639171110002","priorityType":"NONE"}' > /dev/null

# 3. Verify the queue position for the second ticket
curl -s http://localhost:3000/api/ticket/A-002

# 4. Verify the SMS feed
curl -s http://localhost:3000/api/sms-log | head -1

pkill -f "next dev"
```

Expected:
- Three 201 responses.
- `A-002` has `positionAhead: 1`, `estimatedWaitMinutes: 15` (1 × default 15).
- `/api/sms-log` returns 3 messages, newest first.

- [ ] **Step 4: Browser smoke (judge's-eye view)**

```bash
npm run dev
```

Open in a browser, in order:
1. `/` — landing renders, "Patient check-in" link works.
2. `/checkin` — submit a ticket → redirected to `/q/A-00X`, status page shows position + ETA, polling visibly refreshes.
3. `/demo/sms-inbox` in a second tab — the check-in SMS appears within 2s.
4. `/login` → sign in as `nurse@clinic.test / nurse123` → `/staff` still loads (regression check).

Stop the dev server.

- [ ] **Step 5: Update README**

Add a "Patient flow demo" section under the existing scripts table:

```markdown
## Patient flow demo (Phase 2)

1. Run `npm run qr:poster` once to generate `public/checkin-qr.png`.
2. Open `http://localhost:3000/demo/sms-inbox` in one tab — leave it open.
3. Open `http://localhost:3000/checkin` in another tab, fill the form, submit.
4. The patient lands on `/q/A-00X` with a live position counter.
5. The SMS inbox in tab 1 shows the confirmation SMS within 2 seconds.
```

Commit:

```bash
git add README.md
git commit -m "docs: document Phase 2 patient flow demo steps"
```

- [ ] **Step 6: Tag Phase 2 complete**

```bash
git tag -a phase-2-complete -m "Phase 2: patient flow + simulated SMS"
git log --oneline | head -20
```

---

## Phase 2 Done. What's Next

After this plan executes successfully, write the next plan: **Phase 3 (Staff dashboard + lobby display + SSE)** — replaces the polling on `/q/[ticket]` and `/demo/sms-inbox` with SSE, builds `/staff` queue ops + `/display` lobby view, and implements the §8.1 priority-window ordering in `src/lib/queue.ts` (drop-in replacement for the FIFO stub shipped here).
