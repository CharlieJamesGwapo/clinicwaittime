export const LOCALES = ["en", "tl"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "tl";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

const messages = {
  en: {
    landing: {
      sdgTag: "SDG 3 — Good Health & Well-being",
      title: "Clinic Wait-Time Tracker",
      blurb:
        "Real-time queuing and wait-time monitoring for Philippine clinics — so patients can wait at home, not in line, and staff have the data they need to plan their day.",
      ctaPatient: "Patient check-in",
      ctaLogin: "Staff & admin login",
      personasHeading: "For everyone in the clinic",
      patientsTitle: "Patients",
      patientsBlurb:
        "Walk in, scan the QR, get a ticket. We text you when it's almost your turn.",
      patientsCta: "Open check-in",
      nursesTitle: "Nurses",
      nursesBlurb: "See who's next, flag emergencies, and call patients with one tap.",
      nursesCta: "Staff dashboard",
      adminsTitle: "Admins",
      adminsBlurb: "Wait-time trends, peak hours, and dropout rate to plan staffing.",
      adminsCta: "Admin analytics",
      inboxTitle: "See the simulated SMS flow",
      inboxBlurb: "Every notification the system sends lands here in real time — no real SMS, no cost.",
      inboxCta: "Open inbox",
      lobbyTitle: "Lobby display",
      lobbyBlurb: "Fullscreen “Now Serving” for a waiting-room TV.",
      lobbyCta: "Open display",
      footerLeft: "IS70 / ISS170 Technopreneurship — Activity Deliverable",
      footerRight: "Built with Next.js 16 · Prisma · NextAuth",
    },
    checkin: {
      back: "Back",
      title: "Patient check-in",
      subtitle: "We'll notify you when you're almost up — feel free to wait outside.",
      name: "Full name",
      namePlaceholder: "Aling Maria Cruz",
      phone: "Phone",
      email: "Email",
      channel: "How should we reach you?",
      channelSms: "SMS",
      channelSmsDesc: "Text to your phone",
      channelEmail: "Email",
      channelEmailDesc: "Send to your inbox",
      reason: "Reason for visit",
      reasonHelp: "Optional — helps the nurse prepare for your consultation.",
      reasonPlaceholder: "e.g. fever and cough for 3 days",
      priority: "Priority",
      priorityNone: "None",
      priorityNoneDesc: "Regular walk-in",
      priorityPwd: "PWD",
      priorityPwdDesc: "Person with disability",
      priorityCitizen: "Senior",
      priorityCitizenDesc: "60 years and older",
      priorityPregnant: "Pregnant",
      priorityPregnantDesc: "Expecting mother",
      submit: "Get my ticket",
      submitting: "Submitting…",
    },
    ticket: {
      back: "Back",
      yourTicket: "Your ticket",
      aheadOfYou: "Ahead of you",
      estWait: "Est. wait",
      now: "Now",
      footer: "Updates automatically — keep this page open.",
      waiting: "You're in the queue. We'll text you when you're almost up.",
      called: "It's your turn! Please head to the consultation room.",
      serving: "You're being seen now.",
      done: "All done — thank you!",
      skipped: "Marked as no-show. Please check in again at the desk.",
      dropout: "Your ticket has expired. Please check in again.",
    },
    locale: {
      english: "English",
      tagalog: "Tagalog",
      toggleAria: "Change language",
    },
  },
  tl: {
    landing: {
      sdgTag: "SDG 3 — Mabuting Kalusugan at Kapakanan",
      title: "Clinic Wait-Time Tracker",
      blurb:
        "Real-time na pagsubaybay ng pila at oras ng paghihintay para sa mga klinika sa Pilipinas — para makapag-antay ang mga pasyente sa bahay, hindi sa pila, at may datos ang staff sa pagpaplano ng kanilang araw.",
      ctaPatient: "Mag-check-in",
      ctaLogin: "Staff at admin login",
      personasHeading: "Para sa lahat sa klinika",
      patientsTitle: "Mga Pasyente",
      patientsBlurb:
        "Pumasok, i-scan ang QR, kumuha ng ticket. Tatawagan ka namin kapag malapit na.",
      patientsCta: "Buksan ang check-in",
      nursesTitle: "Mga Nars",
      nursesBlurb:
        "Tingnan kung sino ang susunod, mag-flag ng emergency, at tawagin ang pasyente sa isang tap.",
      nursesCta: "Staff dashboard",
      adminsTitle: "Mga Admin",
      adminsBlurb:
        "Wait-time trends, peak hours, at dropout rate para sa pagpaplano ng staffing.",
      adminsCta: "Admin analytics",
      inboxTitle: "Tingnan ang simulated na SMS",
      inboxBlurb:
        "Lahat ng notification na ipapadala ng system, dito kasabay-sabay lumalabas — walang totoong SMS, walang gastos.",
      inboxCta: "Buksan ang inbox",
      lobbyTitle: "Lobby display",
      lobbyBlurb: "Fullscreen na “Tinatawag Ngayon” para sa TV sa waiting room.",
      lobbyCta: "Buksan ang display",
      footerLeft: "IS70 / ISS170 Technopreneurship — Activity Deliverable",
      footerRight: "Ginawa gamit ang Next.js 16 · Prisma · NextAuth",
    },
    checkin: {
      back: "Bumalik",
      title: "Pag-check-in ng pasyente",
      subtitle:
        "Aabisuhan ka namin kapag malapit ka nang tawagin — pwede kang mag-antay sa labas.",
      name: "Buong pangalan",
      namePlaceholder: "Aling Maria Cruz",
      phone: "Telepono",
      email: "Email",
      channel: "Paano kayo aabisuhan?",
      channelSms: "SMS",
      channelSmsDesc: "Text sa telepono mo",
      channelEmail: "Email",
      channelEmailDesc: "Padala sa inbox mo",
      reason: "Bakit magpapa-check-up?",
      reasonHelp: "Hindi kailangan — pero tutulong ito sa nars na ihanda ang konsultasyon.",
      reasonPlaceholder: "halimbawa: lagnat at ubo nang 3 araw",
      priority: "Priority",
      priorityNone: "Wala",
      priorityNoneDesc: "Regular na walk-in",
      priorityPwd: "PWD",
      priorityPwdDesc: "Person with disability",
      priorityCitizen: "Senior",
      priorityCitizenDesc: "60 anyos pataas",
      priorityPregnant: "Buntis",
      priorityPregnantDesc: "Buntis",
      submit: "Kuhanin ang ticket",
      submitting: "Sinusumite…",
    },
    ticket: {
      back: "Bumalik",
      yourTicket: "Ticket mo",
      aheadOfYou: "Nauuna sa'yo",
      estWait: "Tantsa",
      now: "Ngayon na",
      footer: "Awtomatikong nag-uupdate — huwag isara ang page.",
      waiting: "Nasa pila ka. Tatawagan ka namin kapag malapit na.",
      called: "Ikaw na! Pumunta na po sa consultation room.",
      serving: "Tinitingnan ka na ngayon.",
      done: "Tapos na — salamat!",
      skipped: "Na-mark na walang sumipot. Mag-check-in ulit sa desk.",
      dropout: "Nag-expire ang ticket mo. Mag-check-in ulit.",
    },
    locale: {
      english: "English",
      tagalog: "Tagalog",
      toggleAria: "Palitan ang wika",
    },
  },
};

type Messages = typeof messages.en;

export function t(locale: Locale): Messages {
  return messages[locale] ?? messages.en;
}
