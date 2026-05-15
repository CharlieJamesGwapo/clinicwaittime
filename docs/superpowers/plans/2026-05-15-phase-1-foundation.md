# Clinic Wait-Time Tracker — Phase 1 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Next.js 16 + Prisma + NextAuth skeleton with two seeded users (nurse, admin) able to log in and reach role-specific stub pages, plus a Vitest test runner ready for later business-logic tests.

**Architecture:** Single Next.js App Router project. SQLite via Prisma for local dev. NextAuth credentials provider with bcrypt-hashed seeded users. Route protection via `middleware.ts`. Tailwind + shadcn/ui for styling. Vitest for unit tests.

**Tech Stack:** Next.js 16, TypeScript, Tailwind, shadcn/ui, Prisma, SQLite, NextAuth, bcryptjs, Vitest

**Working directory:** `/Users/a1234/Desktop/michael_lee` (the existing git repo with the design spec already committed)

**Reference spec:** `docs/superpowers/specs/2026-05-15-clinic-wait-time-tracker-design.md`

---

## File Structure (created across the tasks below)

```
package.json                           # project deps + scripts
tsconfig.json                          # TS config (Next.js default)
next.config.ts                         # Next.js config
tailwind.config.ts                     # Tailwind config
postcss.config.mjs                     # PostCSS for Tailwind
.gitignore                             # ignore node_modules, .env, .next, db
.env.local                             # DATABASE_URL, NEXTAUTH_SECRET (NOT committed)
.env.example                           # template for the above (committed)
components.json                        # shadcn/ui config

prisma/schema.prisma                   # full data model (Ticket, User, SmsLog, Setting)
prisma/seed.ts                         # seeds two users + settings

src/lib/db.ts                          # Prisma client singleton
src/lib/auth.ts                        # NextAuth options
src/lib/password.ts                    # bcrypt hash/verify helpers (testable)

src/middleware.ts                      # role-aware route protection
src/app/layout.tsx                     # root layout
src/app/globals.css                    # Tailwind directives
src/app/page.tsx                       # landing page
src/app/login/page.tsx                 # login form
src/app/staff/page.tsx                 # STAFF role stub
src/app/admin/page.tsx                 # ADMIN role stub
src/app/api/auth/[...nextauth]/route.ts # NextAuth handler

src/components/ui/button.tsx           # shadcn button
src/components/ui/input.tsx            # shadcn input
src/components/ui/label.tsx            # shadcn label
src/components/ui/card.tsx             # shadcn card

src/lib/__tests__/password.test.ts     # bcrypt helper tests

vitest.config.ts                       # Vitest config
```

---

## Task 1: Initialize the Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `.gitignore`

- [ ] **Step 1: Run create-next-app**

```bash
cd /Users/a1234/Desktop/michael_lee
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

Expected: Files scaffolded. If it complains the directory isn't empty (because `docs/` and `.git/` exist), pass `--force` to overwrite — Next won't touch `docs/` or `.git/`. If it asks whether to use Turbopack, accept the default.

- [ ] **Step 2: Replace the default landing page**

Overwrite `src/app/page.tsx` with the minimal landing the project actually needs:

```tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold">Clinic Wait-Time Tracker</h1>
      <p className="text-muted-foreground max-w-md text-center">
        Real-time queuing and wait-time monitoring for Philippine clinics.
      </p>
      <div className="flex gap-3">
        <Link href="/login" className="underline">Staff & admin login</Link>
        <Link href="/checkin" className="underline">Patient check-in</Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify it builds and runs**

```bash
npm run build
```

Expected: Build succeeds with no errors. (`/checkin` will 404 — that's fine, comes in Phase 2.)

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(phase-1): scaffold Next.js + Tailwind project"
```

---

## Task 2: Add Prisma with the full schema

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/db.ts`, `.env.local`, `.env.example`
- Modify: `package.json` (adds `prisma` dev dep and `@prisma/client` runtime dep, plus `db:migrate`, `db:seed`, `db:studio` scripts)

- [ ] **Step 1: Install Prisma**

```bash
npm install prisma @prisma/client
npm install -D tsx
```

(`tsx` lets us run the TypeScript seed script directly.)

- [ ] **Step 2: Initialize Prisma with SQLite**

```bash
npx prisma init --datasource-provider sqlite
```

Expected: creates `prisma/schema.prisma` and appends `DATABASE_URL="file:./dev.db"` to `.env`.

- [ ] **Step 3: Move the DATABASE_URL out of `.env` into `.env.local`**

Delete the `.env` file Prisma created (we use `.env.local` instead — Next.js loads it automatically and it's already gitignored by the Next.js template). Create `.env.local`:

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="dev-secret-change-me-in-prod"
NEXTAUTH_URL="http://localhost:3000"
```

And create `.env.example` (committed) with the same keys but placeholder values:

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 4: Write the schema**

Overwrite `prisma/schema.prisma` with the full schema from the spec:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Ticket {
  id            String        @id @default(uuid())
  number        String        @unique
  patientName   String
  phone         String
  priorityType  String        @default("NONE")
  status        String        @default("WAITING")
  createdAt     DateTime      @default(now())
  calledAt      DateTime?
  servedAt      DateTime?
  completedAt   DateTime?
  smsLogs       SmsLog[]
}

model User {
  id           String  @id @default(uuid())
  email        String  @unique
  passwordHash String
  role         String
}

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

(SQLite doesn't support Prisma enums, so we use string fields with constrained values defined in TypeScript constants later. This keeps the dev DB simple. Postgres deployment can migrate to real enums if desired.)

- [ ] **Step 5: Run the initial migration**

```bash
npx prisma migrate dev --name init
```

Expected: Creates `prisma/migrations/<timestamp>_init/` and generates the Prisma client.

- [ ] **Step 6: Create the Prisma client singleton**

Create `src/lib/db.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

(Prevents new client per HMR reload in dev.)

- [ ] **Step 7: Add db scripts to package.json**

Edit `package.json` `"scripts"` section to add:

```json
"db:migrate": "prisma migrate dev",
"db:studio": "prisma studio",
"db:seed": "tsx prisma/seed.ts"
```

And add a `"prisma"` top-level key:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 8: Verify the schema migration produced the tables**

```bash
npx prisma studio --browser none &
sleep 2
curl -s http://localhost:5555 > /dev/null && echo "Studio reachable"
kill %1 2>/dev/null
```

(Or skip the curl check and just visit http://localhost:5555 in a browser. The point is to confirm Studio opens without schema errors.)

- [ ] **Step 9: Commit**

```bash
git add prisma/ src/lib/db.ts .env.example package.json package-lock.json
git commit -m "feat(phase-1): add Prisma schema and SQLite migration"
```

---

## Task 3: Add Vitest and write password-helper tests (TDD red)

**Files:**
- Create: `vitest.config.ts`, `src/lib/password.ts`, `src/lib/__tests__/password.test.ts`
- Modify: `package.json` (add vitest deps and `test` script)

- [ ] **Step 1: Install Vitest and bcryptjs**

```bash
npm install bcryptjs
npm install -D vitest @types/bcryptjs
```

- [ ] **Step 2: Create vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Add the test script to package.json**

In `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write the failing test**

Create `src/lib/__tests__/password.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password helpers", () => {
  it("hashPassword returns a bcrypt hash that is not the plaintext", async () => {
    const hash = await hashPassword("nurse123");
    expect(hash).not.toBe("nurse123");
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("verifyPassword returns true for the correct password", async () => {
    const hash = await hashPassword("nurse123");
    await expect(verifyPassword("nurse123", hash)).resolves.toBe(true);
  });

  it("verifyPassword returns false for the wrong password", async () => {
    const hash = await hashPassword("nurse123");
    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

```bash
npm test
```

Expected: FAIL — "Cannot find module '@/lib/password'" or similar.

- [ ] **Step 6: Implement the minimal code to pass**

Create `src/lib/password.ts`:

```ts
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
```

- [ ] **Step 7: Run the tests to verify they pass**

```bash
npm test
```

Expected: PASS — 3 tests.

- [ ] **Step 8: Commit**

```bash
git add vitest.config.ts src/lib/password.ts src/lib/__tests__/password.test.ts package.json package-lock.json
git commit -m "feat(phase-1): add Vitest and password hashing helpers"
```

---

## Task 4: Write the seed script

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Write the seed script**

Create `prisma/seed.ts`:

```ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const nursePw = await bcrypt.hash("nurse123", 10);
  const adminPw = await bcrypt.hash("admin123", 10);

  await db.user.upsert({
    where: { email: "nurse@clinic.test" },
    update: { passwordHash: nursePw, role: "STAFF" },
    create: { email: "nurse@clinic.test", passwordHash: nursePw, role: "STAFF" },
  });

  await db.user.upsert({
    where: { email: "admin@clinic.test" },
    update: { passwordHash: adminPw, role: "ADMIN" },
    create: { email: "admin@clinic.test", passwordHash: adminPw, role: "ADMIN" },
  });

  await db.setting.upsert({
    where: { key: "clinic_name" },
    update: { value: "Barangay Health Center — Demo" },
    create: { key: "clinic_name", value: "Barangay Health Center — Demo" },
  });

  await db.setting.upsert({
    where: { key: "default_consultation_minutes" },
    update: { value: "15" },
    create: { key: "default_consultation_minutes", value: "15" },
  });

  console.log("Seeded: 2 users, 2 settings");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
```

- [ ] **Step 2: Run the seed**

```bash
npm run db:seed
```

Expected output: `Seeded: 2 users, 2 settings`

- [ ] **Step 3: Verify rows exist**

```bash
npx prisma studio --browser none &
sleep 2
# In a browser: open http://localhost:5555 and confirm 2 rows in User and 2 in Setting.
kill %1 2>/dev/null
```

Alternative quick verification without Studio:

```bash
node -e "const{PrismaClient}=require('@prisma/client');const d=new PrismaClient();d.user.count().then(n=>{console.log('users:',n);return d.\$disconnect()})"
```

Expected: `users: 2`

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat(phase-1): seed demo nurse and admin users"
```

---

## Task 5: Install shadcn/ui base components

**Files:**
- Create: `components.json`, `src/components/ui/button.tsx`, `src/components/ui/input.tsx`, `src/components/ui/label.tsx`, `src/components/ui/card.tsx`
- Modify: `src/app/globals.css` (shadcn theme variables), `tailwind.config.ts` (shadcn animations), `src/lib/utils.ts` (created by init)

- [ ] **Step 1: Run shadcn init**

```bash
npx shadcn@latest init --yes --base-color slate
```

Expected: Creates `components.json`, `src/lib/utils.ts`, updates `globals.css` with theme variables and `tailwind.config.ts` with shadcn presets.

- [ ] **Step 2: Add the base components we need**

```bash
npx shadcn@latest add button input label card --yes
```

Expected: Creates the four files listed under `src/components/ui/`.

- [ ] **Step 3: Verify the build still works**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add components.json src/components/ src/lib/utils.ts src/app/globals.css tailwind.config.ts package.json package-lock.json
git commit -m "feat(phase-1): add shadcn/ui base components (button, input, label, card)"
```

---

## Task 6: Configure NextAuth

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/types/next-auth.d.ts`
- Modify: `package.json`

- [ ] **Step 1: Install NextAuth**

```bash
npm install next-auth@beta
```

(`@beta` because v5 / Auth.js works natively with App Router. v4 also works but has older patterns.)

- [ ] **Step 2: Create the auth config**

Create `src/lib/auth.ts`:

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "");
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role: string }).role;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.role) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
});
```

- [ ] **Step 3: Create the API route**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 4: Extend the session type**

Create `src/types/next-auth.d.ts`:

```ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { role?: string } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
  }
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth src/types package.json package-lock.json
git commit -m "feat(phase-1): configure NextAuth with credentials provider"
```

---

## Task 7: Build the login page

**Files:**
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: Build the login form**

Create `src/app/login/page.tsx`:

```tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setPending(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push(params.get("callbackUrl") ?? "/staff");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Demo: nurse@clinic.test / nurse123 or admin@clinic.test / admin123
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 2: Install `next-auth/react` peer (already in next-auth package, just verify)**

```bash
node -e "require('next-auth/react')" && echo "ok"
```

Expected: `ok`

- [ ] **Step 3: Run the dev server and manually verify**

```bash
npm run dev
```

In a browser: open http://localhost:3000/login. Sign in with `nurse@clinic.test` / `nurse123`. Expect redirect to `/staff` (404 stub — that's fine for now).

Try a wrong password: expect "Invalid email or password" message.

Stop the dev server with Ctrl-C.

- [ ] **Step 4: Commit**

```bash
git add src/app/login
git commit -m "feat(phase-1): add login page with NextAuth credentials"
```

---

## Task 8: Add role-aware route protection middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Write the middleware**

Create `src/middleware.ts`:

```ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  const needsStaff = pathname.startsWith("/staff");
  const needsAdmin = pathname.startsWith("/admin");

  if (!needsStaff && !needsAdmin) return NextResponse.next();

  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (needsAdmin && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/staff", req.url));
  }

  if (needsStaff && role !== "STAFF" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/staff/:path*", "/admin/:path*"],
};
```

(ADMIN can also reach /staff — they're a superset of permissions. STAFF cannot reach /admin.)

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(phase-1): add role-aware route protection middleware"
```

---

## Task 9: Build the staff and admin stub pages

**Files:**
- Create: `src/app/staff/page.tsx`, `src/app/admin/page.tsx`

- [ ] **Step 1: Create the staff stub**

Create `src/app/staff/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function StaffPage() {
  const session = await auth();

  return (
    <main className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Staff Dashboard</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button variant="outline" type="submit">Sign out</Button>
        </form>
      </header>
      <p className="text-muted-foreground">
        Signed in as {session?.user?.email} ({session?.user?.role})
      </p>
      <p className="mt-4">Queue management will live here in Phase 3.</p>
    </main>
  );
}
```

- [ ] **Step 2: Create the admin stub**

Create `src/app/admin/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  const session = await auth();

  return (
    <main className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button variant="outline" type="submit">Sign out</Button>
        </form>
      </header>
      <p className="text-muted-foreground">
        Signed in as {session?.user?.email} ({session?.user?.role})
      </p>
      <p className="mt-4">Analytics charts will live here in Phase 4.</p>
    </main>
  );
}
```

- [ ] **Step 3: Manually verify end-to-end**

```bash
npm run dev
```

Then in a browser, exercise all four paths:

1. Visit http://localhost:3000/staff while logged out → redirected to `/login?callbackUrl=/staff`.
2. Log in as `nurse@clinic.test` / `nurse123` → land on `/staff` showing "Signed in as nurse@clinic.test (STAFF)".
3. While logged in as nurse, visit `/admin` → redirected to `/staff`.
4. Sign out, log in as `admin@clinic.test` / `admin123` → land on `/staff` (callback default) → manually navigate to `/admin` → page loads showing "(ADMIN)".

Stop the dev server.

- [ ] **Step 4: Commit**

```bash
git add src/app/staff src/app/admin
git commit -m "feat(phase-1): add staff and admin stub pages with sign-out"
```

---

## Task 10: README with run + demo instructions

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write the README**

Create `README.md`:

```markdown
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

Phase 1 (Foundation) — complete. Next.js + Prisma + NextAuth scaffold with login and role-aware routing.

See `docs/superpowers/plans/` for upcoming phase plans.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup and demo accounts"
```

---

## Task 11: Final verification

- [ ] **Step 1: Fresh clone simulation**

```bash
npm run build && npm test
```

Expected:
- Build succeeds with no errors or type warnings.
- All 3 password tests pass.

- [ ] **Step 2: Smoke-test the end-to-end auth flow**

```bash
npm run dev
```

Walk through, in order:
1. Visit `/` → landing page renders, both links present.
2. Click "Staff & admin login" → `/login` form renders.
3. Sign in as nurse → reach `/staff` showing nurse identity + STAFF role.
4. Visit `/admin` from the URL bar → redirected back to `/staff`.
5. Sign out → land on `/`.
6. Sign in as admin → reach `/staff`.
7. Visit `/admin` → admin page loads showing admin identity + ADMIN role.
8. Sign out → land on `/`.

If any step fails, that's a Phase 1 bug — fix it before declaring Phase 1 done. The previous tasks' tests should keep passing.

- [ ] **Step 3: Tag Phase 1 complete**

```bash
git tag -a phase-1-complete -m "Phase 1: Next.js + Prisma + NextAuth scaffold"
git log --oneline
```

Expected: A clean linear history of phase-1 commits ending at the tag.

---

## Phase 1 Done. What's Next

After this plan executes successfully, write the next plan: **Phase 2 (Patient flow + simulated SMS)** — covering `/checkin`, `/q/[ticket]`, the `SmsLog` write-on-event pattern, and the `/demo/sms-inbox` panel. That plan will be saved alongside this one in `docs/superpowers/plans/`.
