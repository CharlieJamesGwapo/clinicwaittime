"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminTabs({
  tabs,
}: {
  tabs: { href: string; label: string; icon: React.ReactNode }[];
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname?.startsWith(href);
  }

  return (
    <nav className="flex gap-1 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0" aria-label="Admin sections">
      {tabs.map((t) => {
        const active = isActive(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              active
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {t.icon}
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
