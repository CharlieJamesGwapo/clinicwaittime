import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Step = {
  n: string;
  title: string;
  blurb: string;
  cta: { href: string; label: string };
  open?: { href: string; label: string }[];
};

const STEPS: Step[] = [
  {
    n: "1",
    title: "Land on the project",
    blurb:
      "Open the landing page. The EN/TL toggle in the top right flips the whole UI to Tagalog — including the SMS templates patients receive.",
    cta: { href: "/", label: "Open landing" },
  },
  {
    n: "2",
    title: "Patient walks in (Aling Maria)",
    blurb:
      "Scan the printed QR poster (or open /checkin directly). Fill in name, phone, choose Senior priority, submit. You're redirected to your live ticket page.",
    cta: { href: "/checkin", label: "Open check-in" },
  },
  {
    n: "3",
    title: "Watch the simulated SMS arrive",
    blurb:
      "Open /demo/sms-inbox alongside the patient ticket. The check-in confirmation message appears within ~250ms via SSE — no real SMS, no cost.",
    cta: { href: "/demo/sms-inbox", label: "Open inbox" },
  },
  {
    n: "4",
    title: "Lobby display",
    blurb:
      "/display is the fullscreen \"Now Serving\" panel for a waiting-room TV. It auto-scales the ticket number to fill the screen and subscribes to the same SSE stream.",
    cta: { href: "/display", label: "Open display" },
  },
  {
    n: "5",
    title: "Sign in as Nurse Joey",
    blurb:
      "Log in with nurse@clinic.test / nurse123. The Staff Dashboard lists the queue with priority badges and elapsed wait. Try \"Call Next\" — the patient ticket goes WAITING → CALLED, the lobby updates instantly, and the patient gets a \"your turn\" SMS in the inbox.",
    cta: { href: "/login", label: "Sign in (nurse)" },
  },
  {
    n: "6",
    title: "Offline resilience",
    blurb:
      "Toggle your browser to offline (DevTools → Network → Offline). Click \"Complete & call next\" — the action is queued in localStorage and an amber banner appears. Toggle back online; the action replays and the banner confirms the sync.",
    cta: { href: "/staff", label: "Open staff" },
  },
  {
    n: "7",
    title: "Sign in as Dr. Santos",
    blurb:
      "Log in with admin@clinic.test / admin123. The Admin Dashboard shows the last 7 days: wait-time line chart, arrival-by-hour histogram, dropout rate, priority pie. Click \"Export CSV\" to download the ticket log.",
    cta: { href: "/login", label: "Sign in (admin)" },
  },
  {
    n: "8",
    title: "Swap to real SMS in production",
    blurb:
      "The simulated channel is a single function: writeSmsLog() in src/lib/sms.ts. To go live with Semaphore / Twilio / your provider, swap that function to call their API and the rest of the app keeps working unchanged. See the README for the exact change.",
    cta: { href: "https://github.com", label: "See architecture notes" },
  },
];

export default function WalkthroughPage() {
  return (
    <main id="main" className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-8 sm:py-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to landing
        </Link>
        <header className="mt-4 mb-8">
          <p className="text-xs uppercase tracking-widest text-emerald-700 font-medium">
            5-minute demo
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-2">
            Walkthrough
          </h1>
          <p className="text-base text-slate-600 mt-3 max-w-2xl">
            A guided tour through every surface of the clinic. Each step takes
            about 30 seconds — open multiple tabs and watch everything react
            live to each click.
          </p>
        </header>

        <ol className="flex flex-col gap-4">
          {STEPS.map((s) => (
            <Card key={s.n}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white font-mono text-sm">
                    {s.n}
                  </span>
                  <div className="flex-1">
                    <CardTitle className="text-base sm:text-lg">{s.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-slate-600 sm:ml-13 ml-0">{s.blurb}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={s.cta.href}>
                    <Button variant="outline" size="sm">
                      {s.cta.label} →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </ol>

        <Card className="mt-8 bg-slate-900 text-white border-slate-900">
          <CardContent className="py-6">
            <p className="text-sm font-medium">Demo accounts</p>
            <ul className="mt-2 text-sm text-slate-300 space-y-1 font-mono">
              <li>nurse@clinic.test · nurse123</li>
              <li>admin@clinic.test · admin123</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
