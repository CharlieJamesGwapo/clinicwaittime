"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LOCALES, type Locale } from "@/lib/i18n/messages";

const LABEL: Record<Locale, string> = { en: "EN", tl: "TL" };

export function LocaleToggle({ current }: { current: Locale }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState<Locale>(current);

  function set(next: Locale) {
    setValue(next);
    document.cookie = `locale=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="inline-flex items-center rounded-full border bg-white text-xs font-medium overflow-hidden">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => set(l)}
          className={`px-3 py-1 transition-colors ${
            value === l ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          {LABEL[l]}
        </button>
      ))}
    </div>
  );
}
