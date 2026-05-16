import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServerLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/messages";
import { LocaleToggle } from "@/components/locale-toggle";

export default async function Home() {
  const locale = await getServerLocale();
  const m = t(locale).landing;

  return (
    <main id="main" className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 flex justify-end">
        <LocaleToggle current={locale} />
      </div>
      <section className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 sm:pt-12 pb-12">
        <p className="text-xs uppercase tracking-widest text-emerald-700 font-medium">
          {m.sdgTag}
        </p>
        <h1 className="mt-2 text-3xl sm:text-5xl font-semibold tracking-tight">
          {m.title}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl">
          {m.blurb}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/checkin">
            <Button size="lg">{m.ctaPatient}</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              {m.ctaLogin}
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-8 pb-20">
        <h2 className="text-sm uppercase tracking-widest text-slate-500 mb-4">
          {m.personasHeading}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PersonaCard
            title={m.patientsTitle}
            blurb={m.patientsBlurb}
            cta={m.patientsCta}
            href="/checkin"
            tone="emerald"
          />
          <PersonaCard
            title={m.nursesTitle}
            blurb={m.nursesBlurb}
            cta={m.nursesCta}
            href="/staff"
            tone="blue"
          />
          <PersonaCard
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
            <div>
              <p className="text-sm font-medium">{m.inboxTitle}</p>
              <p className="text-xs text-slate-500">{m.inboxBlurb}</p>
            </div>
            <Link href="/demo/sms-inbox">
              <Button variant="outline">{m.inboxCta}</Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="mt-3">
          <CardContent className="py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{m.lobbyTitle}</p>
              <p className="text-xs text-slate-500">{m.lobbyBlurb}</p>
            </div>
            <Link href="/display">
              <Button variant="outline">{m.lobbyCta}</Button>
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
