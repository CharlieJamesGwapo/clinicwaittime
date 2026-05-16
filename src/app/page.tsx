import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <section className="max-w-5xl mx-auto px-4 sm:px-8 pt-12 sm:pt-20 pb-12">
        <p className="text-xs uppercase tracking-widest text-emerald-700 font-medium">
          SDG 3 — Good Health &amp; Well-being
        </p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-semibold tracking-tight">
          Clinic Wait-Time Tracker
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl">
          Real-time queuing and wait-time monitoring for Philippine clinics — so
          patients can wait at home, not in line, and staff have the data they
          need to plan their day.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/checkin">
            <Button size="lg">Patient check-in</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Staff &amp; admin login
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-8 pb-20">
        <h2 className="text-sm uppercase tracking-widest text-slate-500 mb-4">
          For everyone in the clinic
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PersonaCard
            title="Patients"
            blurb="Walk in, scan the QR, get a ticket. We text you when it's almost your turn."
            cta="Open check-in"
            href="/checkin"
            tone="emerald"
          />
          <PersonaCard
            title="Nurses"
            blurb="See who's next, flag emergencies, and call patients with one tap."
            cta="Staff dashboard"
            href="/staff"
            tone="blue"
          />
          <PersonaCard
            title="Admins"
            blurb="Wait-time trends, peak hours, and dropout rate to plan staffing."
            cta="Admin analytics"
            href="/admin"
            tone="violet"
          />
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-8 pb-16">
        <Card>
          <CardContent className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium">See the simulated SMS flow</p>
              <p className="text-xs text-slate-500">
                Every notification the system sends lands here in real time —
                no real SMS, no cost.
              </p>
            </div>
            <Link href="/demo/sms-inbox">
              <Button variant="outline">Open inbox</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="mt-3">
          <CardContent className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Lobby display</p>
              <p className="text-xs text-slate-500">
                Fullscreen &ldquo;Now Serving&rdquo; for a waiting-room TV.
              </p>
            </div>
            <Link href="/display">
              <Button variant="outline">Open display</Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 text-xs text-slate-500 flex flex-wrap justify-between gap-2">
          <span>IS70 / ISS170 Technopreneurship — Activity Deliverable</span>
          <span>Built with Next.js 16 · Prisma · NextAuth</span>
        </div>
      </footer>
    </main>
  );
}

const TONE_BORDER: Record<string, string> = {
  emerald: "border-emerald-200 hover:border-emerald-400",
  blue: "border-blue-200 hover:border-blue-400",
  violet: "border-violet-200 hover:border-violet-400",
};

const TONE_PILL: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
  violet: "bg-violet-100 text-violet-700",
};

function PersonaCard({
  title,
  blurb,
  cta,
  href,
  tone,
}: {
  title: string;
  blurb: string;
  cta: string;
  href: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-xl border-2 bg-white p-6 transition-colors ${TONE_BORDER[tone]}`}
    >
      <p
        className={`inline-block text-xs uppercase tracking-widest font-medium px-2 py-1 rounded ${TONE_PILL[tone]}`}
      >
        {title}
      </p>
      <p className="mt-3 text-sm text-slate-600">{blurb}</p>
      <p className="mt-4 text-sm font-medium text-slate-900">{cta} →</p>
    </Link>
  );
}
