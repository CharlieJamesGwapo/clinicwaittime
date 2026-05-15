# Clinic Wait-Time Tracker

Real-time queuing and wait-time monitoring web app for Philippine clinics. Built as the IS70 / ISS170 Technopreneurship project deliverable.

See `docs/superpowers/specs/2026-05-15-clinic-wait-time-tracker-design.md` for the full design.

## Local setup

Requires Node.js 20+.

```bash
npm install
cp .env.example .env.local                      # edit if needed
npx prisma migrate dev                          # creates SQLite db
npm run db:seed                                 # seeds demo users
npm run dev                                     # http://localhost:3000
```

## Demo accounts

- Nurse Joey: `nurse@clinic.test` / `nurse123`
- Dr. Santos: `admin@clinic.test` / `admin123`

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm test` | Run unit tests (Vitest) |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed demo users + settings |
| `npm run db:studio` | Open Prisma Studio (DB browser) |
| `npm run qr:poster` | Generate `public/checkin-qr.png` pointing at `/checkin` |
| `npm run db:seed-history` | Wipe tickets and backfill 7 days of demo history for `/admin` charts |

## Patient flow demo (Phase 2)

1. Run `npm run qr:poster` (one-off) to refresh the QR poster.
2. Open `http://localhost:3000/demo/sms-inbox` in one tab — keep it open.
3. Open `http://localhost:3000/checkin` in another tab, fill the form, submit.
4. The patient lands on `/q/A-00X` with a live position counter (polls every 2s).
5. The simulated SMS appears in the inbox tab within 2 seconds.

## Project status

- **Phase 1 (Foundation)** — complete (tag `phase-1-complete`). Next.js + Prisma + NextAuth scaffold with login and role-aware routing via `src/proxy.ts` (Next.js 16 renamed `middleware` to `proxy`).
- **Phase 2 (Patient flow + simulated SMS)** — complete (tag `phase-2-complete`). `/checkin`, `/q/[ticket]`, `/demo/sms-inbox`, and three API routes. SMS is simulated (logged to DB, rendered in the inbox panel) — see spec §8.3.
- **Phase 3 (Staff dashboard + lobby + SSE)** — complete (tag `phase-3-complete`). Priority-window ordering, rolling-average ETA, `/staff` queue ops, `/display` lobby, and `/api/queue/stream` SSE — patient/inbox/lobby/staff all live-update through one event channel.
- **Phase 4 (Admin analytics)** — complete (tag `phase-4-complete`). `/admin` Recharts dashboard (wait-time trend, arrival histogram, priority pie, stat cards), `/api/analytics`, CSV export at `/api/analytics/export`, and a `db:seed-history` script that backfills 7 days of plausible tickets so the charts are populated on first load.

See `docs/superpowers/plans/` for upcoming phase plans.
