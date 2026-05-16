import Link from "next/link";
import { getServerLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/messages";
import { ChatWidget } from "@/components/chat-widget";
import { CheckinForm } from "./_form";

export default async function CheckinPage() {
  const locale = await getServerLocale();
  const m = t(locale).checkin;

  return (
    <main id="main" className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-8 sm:py-16">
      <div className="max-w-md mx-auto">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
          ← {m.back}
        </Link>
        <div className="mt-4">
          <CheckinForm locale={locale} labels={m} />
        </div>
      </div>
      <ChatWidget locale={locale} />
    </main>
  );
}
