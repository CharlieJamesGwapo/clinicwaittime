import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./messages";

export async function getServerLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get("locale")?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}
