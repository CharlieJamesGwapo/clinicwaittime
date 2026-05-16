import Link from "next/link";
import {
  UserPlus,
  LogIn,
  MessageSquare,
  Tv,
  Stethoscope,
  BarChart3,
  Users,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServerLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/messages";
import { LocaleToggle } from "@/components/locale-toggle";
import { LiveQueuePulse } from "@/components/live-queue-pulse";
import { ChatWidget } from "@/components/chat-widget";
import { FindMyTicket } from "@/components/find-my-ticket";

export default async function Home() {
  const locale = await getServerLocale();
  const m = t(locale).landing;

  return (
    <main id="main" className="relative min-h-screen bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-blue-400/30 to-emerald-300/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-40 -left-24 h-80 w-80 rounded-full bg-gradient-to-tr from-violet-300/20 to-amber-200/20 blur-3xl"
      />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-8 pt-6 flex justify-end">
        <LocaleToggle current={locale} />
      </div>
      <section className="relative max-w-5xl mx-auto px-4 sm:px-8 pt-6 sm:pt-12 pb-12">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <p className="text-xs uppercase tracking-widest text-emerald-700 font-medium">
            {m.sdgTag}
          </p>
          <LiveQueuePulse label={m.livePulse} />
        </div>
        <h1 className="mt-2 text-3xl sm:text-5xl font-semibold tracking-tight">
          {m.title}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl">
          {m.blurb}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/checkin">
            <Button size="lg" className="cursor-pointer">
              <UserPlus className="h-5 w-5" aria-hidden="true" />
              {m.ctaPatient}
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="cursor-pointer">
              <LogIn className="h-5 w-5" aria-hidden="true" />
              {m.ctaLogin}
            </Button>
          </Link>
        </div>
        <div className="mt-8">
          <FindMyTicket
            label={m.findTicketLabel}
            placeholder={m.findTicketPlaceholder}
            cta={m.findTicketCta}
            notFound={m.findTicketNotFound}
          />
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-8 pb-20">
        <h2 className="text-sm uppercase tracking-widest text-slate-500 mb-4">
          {m.personasHeading}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PersonaCard
            icon={<Users className="h-5 w-5" />}
            title={m.patientsTitle}
            blurb={m.patientsBlurb}
            cta={m.patientsCta}
            href="/checkin"
            tone="emerald"
          />
          <PersonaCard
            icon={<Stethoscope className="h-5 w-5" />}
            title={m.nursesTitle}
            blurb={m.nursesBlurb}
            cta={m.nursesCta}
            href="/staff"
            tone="blue"
          />
          <PersonaCard
            icon={<BarChart3 className="h-5 w-5" />}
            title={m.adminsTitle}
            blurb={m.adminsBlurb}
            cta={m.adminsCta}
            href="/admin"
            tone="violet"
          />
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-8 pb-16">
        <Card>
          <CardContent className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-medium">{m.inboxTitle}</p>
                <p className="text-xs text-slate-500">{m.inboxBlurb}</p>
              </div>
            </div>
            <Link href="/demo/sms-inbox" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto cursor-pointer">
                {m.inboxCta}
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="mt-3">
          <CardContent className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white">
                <Tv className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-medium">{m.lobbyTitle}</p>
                <p className="text-xs text-slate-500">{m.lobbyBlurb}</p>
              </div>
            </div>
            <Link href="/display" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto cursor-pointer">
                {m.lobbyCta}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 text-xs text-slate-500 flex flex-wrap justify-between gap-2">
          <span>{m.footerLeft}</span>
          <span>{m.footerRight}</span>
        </div>
      </footer>
      <ChatWidget locale={locale} />
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
  icon,
  title,
  blurb,
  cta,
  href,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  blurb: string;
  cta: string;
  href: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-xl border-2 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${TONE_BORDER[tone]}`}
    >
      <div
        className={`inline-flex items-center gap-2 text-xs uppercase tracking-widest font-medium px-2 py-1 rounded ${TONE_PILL[tone]}`}
      >
        {icon}
        {title}
      </div>
      <p className="mt-3 text-sm text-slate-600">{blurb}</p>
      <p className="mt-4 text-sm font-medium text-slate-900 inline-flex items-center gap-1">
        {cta}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </p>
    </Link>
  );
}
