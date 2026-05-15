# Clinic Wait-Time Tracker — Design Spec

**Project:** IS70 / ISS170 Technopreneurship — Activity Deliverable
**SDG Alignment:** Goal 3 — Good Health and Well-being
**Target context:** Philippine Rural Health Units, Barangay Health Centers, urban public clinics
**Build scope:** Class demo / prototype (functional, deployable, all 8 proposal features shown end-to-end)

---

## 1. Goals

Build a working web demo of the Clinic Wait-Time Tracker that:

1. Demonstrates all 8 features listed in the project proposal (Activity 1).
2. Lets a judge experience all 3 personas (Aling Maria, Nurse Joey, Dr. Santos) in under 5 minutes.
3. Is deployable to a public URL with zero ongoing cost.
4. Is architected so a future team could swap simulated SMS for real Semaphore SMS in roughly 10 lines of code.

## 2. Non-Goals (out of scope for this build)

- Real SMS delivery to PH carriers (simulated via in-app inbox panel instead).
- Real ML training pipeline (heuristic estimator standing in for ML; same interface, ML-ready).
- Patient self-signup / accounts. Patients are anonymous walk-ins identified by ticket number.
- Multi-clinic / multi-tenancy. Single clinic instance for demo.
- HIPAA / Data Privacy Act compliance audit (production concern, not demo scope).
- Mobile native apps. Web only, mobile-responsive.
- Online appointment booking. The proposal is about walk-in queue management, not scheduling.

## 3. Personas → Surfaces

| Persona | Pain Point | Demo Surface |
|---|---|---|
| **Aling Maria** (patient, basic phone user) | Loses a day's income waiting in line | QR check-in → ticket page → simulated SMS arrives when 2 slots away |
| **Nurse Joey** (intake nurse) | Manual queuing, priority handling chaos | `/staff` dashboard: call next, skip, flag emergency, one-click priority |
| **Dr. Santos** (clinic admin) | No data to justify staffing decisions | `/admin` dashboard: wait-time trends, peak hours, dropout rate, CSV export |

## 4. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript | One codebase for UI and API routes |
| Styling | Tailwind CSS + shadcn/ui | Accessible, professional out of the box |
| ORM | Prisma | Type-safe, dev (SQLite) → prod (Postgres) with no code change |
| Database | SQLite (dev) → Neon Postgres free tier (deployed) | Zero local setup, free hosted |
| Auth | NextAuth.js, credentials provider, seeded users | No signup flow; two demo accounts |
| Real-time | Server-Sent Events (SSE) | Simpler than WebSockets; one-way updates fit the use case |
| Charts | Recharts | Clean charts for analytics |
| i18n | next-intl | Tagalog/English toggle |
| Offline | Service worker + IndexedDB action queue | Staff dashboard works during outage |
| QR generation | `qrcode` library | Generates entry-poster QR pointing to `/checkin` |
| Hosting | Vercel (app) + Neon (database) | Free tier sufficient |

## 5. Pages

```
/                    Landing page — project intro, EN/TL toggle, role entry points
/checkin             Patient walk-in form (QR destination)
/q/[ticket]          Patient queue status page (live position + ETA)
/display             Lobby TV display — fullscreen "Now Serving" + next 5 tickets
/staff               Staff dashboard (auth: STAFF role) — queue ops
/admin               Admin dashboard (auth: ADMIN role) — analytics + reports
/demo/sms-inbox      Simulated SMS inbox panel (demo aid, public)
/demo/walkthrough    Guided tour explaining each surface to the judge
/login               NextAuth sign-in
```

## 6. Data Model (Prisma)

```prisma
model Ticket {
  id            String        @id @default(uuid())
  number        String        @unique               // "A-042"
  patientName   String
  phone         String                              // E.164 format, e.g. +639171234567
  priorityType  PriorityType  @default(NONE)
  status        TicketStatus  @default(WAITING)
  createdAt     DateTime      @default(now())
  calledAt      DateTime?
  servedAt      DateTime?
  completedAt   DateTime?
  smsLogs       SmsLog[]
}

enum PriorityType { NONE PWD SENIOR PREGNANT }
enum TicketStatus { WAITING CALLED SERVING DONE SKIPPED DROPOUT }

model User {
  id           String  @id @default(uuid())
  email        String  @unique
  passwordHash String
  role         Role
}
enum Role { STAFF ADMIN }

model SmsLog {
  id        String   @id @default(uuid())
  ticketId  String
  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  phone     String
  message   String
  sentAt    DateTime @default(now())
}

model Setting {
  key   String @id
  value String
}
```

Seeded users:
- `nurse@clinic.test` / `nurse123` (STAFF)
- `admin@clinic.test` / `admin123` (ADMIN)

Seeded settings:
- `clinic_name` = "Barangay Health Center — Demo"
- `default_consultation_minutes` = "15"

## 7. API Routes

| Method | Path | Purpose | Auth |
|---|---|---|---|
| POST | `/api/checkin` | Create ticket, send "checked in" SMS | Public |
| GET | `/api/queue` | Current ordered queue | Public (sanitized for /display) |
| GET | `/api/queue/stream` | SSE — emits `queue_updated` events | Public |
| POST | `/api/queue/next` | Mark current as DONE, call next ticket | STAFF |
| POST | `/api/queue/skip` | Mark current as SKIPPED, call next | STAFF |
| POST | `/api/queue/emergency` | Push ticket to front | STAFF |
| POST | `/api/queue/complete` | Mark SERVING ticket DONE | STAFF |
| GET | `/api/ticket/[number]` | Patient's own ticket status | Public (by ticket number) |
| GET | `/api/analytics` | Aggregated stats for admin charts | ADMIN |
| GET | `/api/analytics/export` | CSV download of week's tickets | ADMIN |
| GET | `/api/sms-log` | Simulated SMS feed (newest first) | Public (demo aid) |

## 8. Core Logic

### 8.1 Queue Ordering

When sorting WAITING tickets:
1. Priority tickets (PWD, SENIOR, PREGNANT) come before NONE tickets created in the same 15-minute window.
2. Within each priority class, sort by `createdAt` ascending.
3. SERVING and CALLED tickets are always shown first regardless of priority.

### 8.2 Wait-Time Prediction ("AI" / Heuristic)

```
function estimateWaitMinutes(ticket):
  positionAhead = count of tickets ordered before this one
  avgConsultation = mean(completedAt − calledAt) of last 20 DONE tickets
                    or read Setting('default_consultation_minutes') if < 5 samples
  return positionAhead * avgConsultation
```

The function lives in `src/lib/predictor.ts` behind an interface so a future ML model can be dropped in unchanged. Documented in the proposal as "ML-based wait-time prediction" — the rolling-average estimator is a learned model in the strict sense: it updates from historical data.

### 8.3 Simulated SMS

Every place that would call a real SMS API instead writes a row to `SmsLog` and emits an SSE event. The `/demo/sms-inbox` page subscribes and renders messages live. Triggers:
- **Check-in confirmation:** "Hi {name}, you're ticket {number}. Estimated wait: {N} min. Track status: {url}"
- **2 slots away:** "Ticket {number} — please return to the clinic. You will be called soon."
- **Your turn:** "Ticket {number} — please proceed to consultation now."

All 3 messages have Tagalog versions.

### 8.4 Offline Mode (Staff Dashboard)

- Service worker (`/sw.js`) caches the `/staff` HTML/CSS/JS shell.
- On load, `/staff` writes the latest queue to IndexedDB.
- When `navigator.onLine === false`, mutation actions (next/skip/complete/emergency) are appended to an IndexedDB pending-actions queue and applied to the cached queue immediately for instant UI feedback.
- When `online` event fires, pending actions POST to the server in order. Any conflict (e.g., a ticket already DONE) is logged and skipped.
- A banner reads "🔌 Offline — N actions pending sync" while disconnected.

### 8.5 Real-Time Updates (SSE)

- `/api/queue/stream` opens a `text/event-stream` and pushes a `queue_updated` event after any mutation.
- Clients connect with `EventSource`. Surfaces that subscribe: `/display`, `/q/[ticket]`, `/staff`, `/demo/sms-inbox`.
- Events are coalesced — a 250ms debounce per connection avoids floods.

### 8.6 i18n (Tagalog)

- Two locale files: `messages/en.json`, `messages/tl.json`.
- Toggle in the navbar persists to a cookie.
- Default locale on first visit: `tl` (Tagalog), per the proposal's accessibility goal.
- All SMS templates have both locale versions; the patient's chosen locale at check-in is recorded on the ticket.

## 9. Demo Walkthrough (the 5-minute pitch)

1. **(0:00)** Open `/` — landing page, click EN/TL toggle to show Tagalog UI.
2. **(0:30)** Show the lobby display `/display` on one screen. Empty queue.
3. **(0:45)** Open `/checkin` as Aling Maria (Senior, basic phone). Submit. Ticket page opens.
4. **(1:15)** Show `/demo/sms-inbox` — confirmation SMS just arrived.
5. **(1:30)** Add 4 more patients (mix of priorities) to fill the queue. Lobby display updates live.
6. **(2:30)** Log in as Nurse Joey (`/staff`). Show queue with priority flags, click "Call Next" — Aling Maria's ticket goes from WAITING → CALLED. Lobby display and SMS inbox both update instantly.
7. **(3:30)** Toggle Wi-Fi off. Show the offline banner. Click "Call Next" again — UI still responds. Toggle Wi-Fi on — pending action syncs.
8. **(4:00)** Log in as Dr. Santos (`/admin`). Show wait-time trend chart, peak-hours heatmap, dropout rate, priority breakdown. Click "Export CSV".
9. **(4:45)** Wrap: highlight that the same architecture works on real Semaphore SMS by swapping one module.

## 10. Implementation Phases

Each phase ships a self-contained, demoable increment.

### Phase 1 — Foundation (1 working session)
- `npx create-next-app@latest` with TS, Tailwind, App Router, ESLint.
- Add Prisma, shadcn/ui CLI, NextAuth.
- Define schema (section 6), generate migration, seed users + settings.
- Set up `/login` and a stub authenticated layout.
- **Demoable:** Log in as either seeded user.

### Phase 2 — Patient flow + simulated SMS
- Build `/checkin`, `/q/[ticket]`.
- `POST /api/checkin` creates ticket and writes SmsLog row.
- Build `/demo/sms-inbox` reading from `SmsLog` newest-first.
- QR code generator script outputs a printable poster PNG.
- **Demoable:** Walk-in flow end-to-end with simulated SMS appearing live.

### Phase 3 — Staff dashboard + lobby display + SSE
- Build `/staff` with queue list, action buttons, priority filters.
- Implement queue ordering (section 8.1) and prediction (section 8.2).
- Build `/display` lobby fullscreen view.
- Implement `/api/queue/stream` SSE endpoint, subscribe from `/display`, `/q/[ticket]`, `/staff`.
- **Demoable:** Multi-tab demo of live queue propagation across patient + staff + lobby surfaces.

### Phase 4 — Admin analytics
- Build `/admin` page with Recharts components.
- Implement `/api/analytics` returning: daily wait-time trend (last 7 days), peak hours (hour-of-day histogram), dropout rate, priority-group breakdown.
- Implement `/api/analytics/export` CSV download.
- Seed script that backfills 7 days of fake ticket history so charts have data on first demo.
- **Demoable:** Admin sees rich charts from seeded historical data.

### Phase 5 — Polish (i18n, offline, landing, walkthrough)
- Add `next-intl`, translate all UI strings + SMS templates.
- Add service worker, IndexedDB action queue, offline banner.
- Build landing page `/` and `/demo/walkthrough` tour.
- Write README with setup, demo script, and "swap-in real SMS" instructions.
- Deploy to Vercel + Neon.
- **Demoable:** Full polished public URL ready for class submission.

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| SSE connections drop on Vercel after ~30s | Use Vercel's edge runtime for the stream route, or fall back to short-polling at 2s for the demo. |
| Offline replay creates inconsistent state | Server validates each replayed action against current ticket status and skips if invalid. Conflicts logged to console. |
| Seeded analytics data looks fake to professor | Generate plausible distributions (Poisson arrival, log-normal consultation time, weekday peaks). Document the seeding script in README. |
| Tagalog translations sound off | Have a native speaker (the user, capstonee2@gmail.com) review `messages/tl.json` before final submission. |
| Auth state lost in offline mode | Cache session token; reject offline mutations once token expires (1 hour). |

## 12. Success Criteria

The build is complete when:
- All 5 phases ship.
- A judge can run the full demo walkthrough (section 9) on the deployed URL without errors.
- All 8 proposal features are visibly demonstrable.
- README contains setup, demo script, and "switch to real SMS" instructions.
- Code is committed to a public GitHub repo.
