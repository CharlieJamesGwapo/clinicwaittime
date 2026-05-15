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

## Project status

Phase 1 (Foundation) — complete. Next.js + Prisma + NextAuth scaffold with login and role-aware routing via `src/proxy.ts` (Next.js 16 renamed `middleware` to `proxy`).

See `docs/superpowers/plans/` for upcoming phase plans.
