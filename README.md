# Clinic Wait-Time Tracker

Real-time queuing and wait-time monitoring web app for Philippine clinics. Built as the IS70 / ISS170 Technopreneurship project deliverable.

> **5-minute demo:** open [`/demo/walkthrough`](http://localhost:3000/demo/walkthrough) after starting the dev server — it walks a judge through every surface in order.

See `docs/superpowers/specs/2026-05-15-clinic-wait-time-tracker-design.md` for the full design and `docs/superpowers/plans/` for per-phase implementation plans.

## Local setup

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local                      # edit if needed
npx prisma migrate dev                          # creates SQLite db
npm run db:seed                                 # seeds demo users
npm run db:seed-history                         # (optional) 7d of fake history
npm run dev                                     # http://localhost:3000
```

## Demo accounts

- **Nurse Joey** — `nurse@clinic.test` / `nurse123` (STAFF)
- **Dr. Santos** — `admin@clinic.test` / `admin123` (ADMIN)

## Surfaces

| Path | Purpose | Auth |
|---|---|---|
| `/` | Landing with persona CTAs and EN/TL toggle | public |
| `/checkin` | Patient walk-in form | public |
| `/q/[ticket]` | Patient live ticket status | public |
| `/display` | Lobby TV display ("Now Serving") | public |
| `/demo/sms-inbox` | Simulated SMS feed | public |
| `/demo/walkthrough` | 8-step guided demo tour | public |
| `/login` | NextAuth credentials sign-in | public |
| `/staff` | Nurse queue dashboard + offline queue | STAFF |
| `/admin` | Analytics dashboard + CSV export | ADMIN |

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm test` | Run unit tests (Vitest) |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed demo users + settings |
| `npm run db:seed-history` | Wipe tickets and backfill 7 days of demo history for `/admin` charts |
| `npm run db:studio` | Open Prisma Studio (DB browser) |
| `npm run qr:poster` | Generate `public/checkin-qr.png` pointing at `/checkin` |

## How the simulated SMS works (and how to swap to real SMS)

Every place that would call a real SMS API instead writes a row to the `SmsLog` table and emits a `queue_updated` SSE event. The `/demo/sms-inbox` page subscribes and renders messages live.

**Single integration point:** `src/lib/sms.ts` exports one function, `writeSmsLog`. Every notification flow goes through it.

To go live with a real provider:

```diff
 // src/lib/sms.ts
 import { db } from "@/lib/db";
+import { Semaphore } from "your-semaphore-sdk";  // or twilio, etc.

 export async function writeSmsLog(input: {
   ticketId: string;
   phone: string;
   message: string;
 }): Promise<void> {
   await db.smsLog.create({
     data: input,
   });
+  // Send the real SMS
+  await Semaphore.send({
+    apikey: process.env.SEMAPHORE_API_KEY,
+    number: input.phone,
+    message: input.message,
+  });
 }
```

That's the entire change. The inbox panel keeps working (it reads from `SmsLog`), and every existing call site picks up real delivery automatically. Cost in PH: roughly ₱0.50/SMS via Semaphore.

## Deploying to Vercel + Neon Postgres

The dev environment uses SQLite for zero-setup local hacking. For deploy:

1. **Provision a Neon Postgres database** (free tier is sufficient). Copy the connection string.

2. **Switch Prisma to PostgreSQL.** Edit `prisma/schema.prisma`:
   ```diff
    datasource db {
   -  provider = "sqlite"
   +  provider = "postgresql"
      url      = env("DATABASE_URL")
    }
   ```

3. **Generate a fresh Postgres migration locally** (the existing SQLite migrations won't apply):
   ```bash
   rm -rf prisma/migrations
   DATABASE_URL="postgresql://<neon>" npx prisma migrate dev --name init
   DATABASE_URL="postgresql://<neon>" npm run db:seed
   ```

4. **Configure Vercel project env vars** (Project → Settings → Environment Variables):
   - `DATABASE_URL` — the Neon connection string
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your deployed origin (e.g., `https://clinic.vercel.app`)

5. **Deploy:**
   ```bash
   npx vercel
   npx vercel --prod
   ```

The build pipeline runs `prisma generate` automatically through `@prisma/client`'s postinstall, but if you hit a "Prisma Client not generated" build error, add `"postinstall": "prisma generate"` to `package.json` scripts.

## Project status

- **Phase 1 (Foundation)** — complete (tag `phase-1-complete`). Next.js + Prisma + NextAuth scaffold with login and role-aware routing via `src/proxy.ts` (Next.js 16 renamed `middleware` to `proxy`).
- **Phase 2 (Patient flow + simulated SMS)** — complete (tag `phase-2-complete`). `/checkin`, `/q/[ticket]`, `/demo/sms-inbox`, and three API routes. SMS is simulated (logged to DB, rendered in the inbox panel) — see spec §8.3.
- **Phase 3 (Staff dashboard + lobby + SSE)** — complete (tag `phase-3-complete`). Priority-window ordering, rolling-average ETA, `/staff` queue ops, `/display` lobby, and `/api/queue/stream` SSE — patient/inbox/lobby/staff all live-update through one event channel.
- **Phase 4 (Admin analytics)** — complete (tag `phase-4-complete`). `/admin` Recharts dashboard, `/api/analytics`, CSV export at `/api/analytics/export`, and a `db:seed-history` script that backfills 7 days of plausible tickets.
- **Phase 5 (Polish)** — complete (tag `phase-5-complete`). Bilingual EN/TL UI + Tagalog SMS templates (default Tagalog per spec §8.6), offline action queue on `/staff` with reconnect-replay banner, `/demo/walkthrough` guided tour, and this deploy guide.
