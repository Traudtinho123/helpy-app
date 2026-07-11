import type { LucideIcon } from "lucide-react";

export type InboxFilter =
  | "heute"
  | "neu"
  | "wichtig"
  | "antwort-noetig"
  | "angebote"
  | "rechnungen"
  | "termine"
  | "archiv";

export type EmailPriority = "hoch" | "mittel" | "niedrig";

export type EmailCategory =
  | "heute"
  | "neu"
  | "wichtig"
  | "antwort-noetig"
  | "angebote"
  | "rechnungen"
  | "termine"
  | "archiv";

export type EmailSmartBadge =
  | "dringend"
  | "angebot"
  | "rechnung"
  | "termin"
  | "antwort-empfohlen"
  | "antwort-fertig";

export type ChipFilter =
  | "alle"
  | "ungelesen"
  | "heute"
  | "diese-woche"
  | "mit-termin"
  | "mit-angebot"
  | "mit-rechnung"
  | "dringend";

export type EmailOfferDetail = {
  company: string;
  amount: string;
  deadline: string;
};

export type DetectedAppointment = {
  weekday: string;
  time: string;
  company: string;
  title: string;
  date: string;
  contact?: string;
  type?: "angebot" | "telefonat" | "besichtigung" | "termin";
};

export type EmailAnalysis = {
  summary: string;
  recommendation?: string;
  tasks: string[];
  appointments: string[];
  offers: string[];
  offerDetail?: EmailOfferDetail;
  suggestedReply: string;
  detectedAppointment?: DetectedAppointment;
};

export type Email = {
  id: string;
  sender: string;
  company: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  priority: EmailPriority;
  categories: EmailCategory[];
  badges: EmailSmartBadge[];
  isToday: boolean;
  isThisWeek: boolean;
  analysis: EmailAnalysis;
};

export type InboxFilterItem = {
  id: InboxFilter;
  label: string;
  icon: LucideIcon;
  count?: number;
};

export const helpyDailyRecommendations = [
  "Angebot für Weber & Co. erstellen — bis Freitag",
  "Termin mit Schmidt GmbH bestätigen (Di, 14:00)",
  "Zahlungserinnerung Müller Logistik beantworten",
] as const;

export const helpyTimeSavingMinutes = 38;

export const mockEmails: Email[] = [
  {
    id: "1",
    sender: "Thomas Müller",
    company: "Weber & Co. GmbH",
    subject: "Angebotsanfrage: Büroausstattung für 45 Arbeitsplätze",
    preview:
      "Sehr geehrte Frau Traudt, wir planen die Erneuerung unserer Büroausstattung und benötigen ein verbindliches Angebot bis Freitag…",
    time: "08:42",
    unread: true,
    priority: "hoch",
    categories: ["heute", "neu", "wichtig", "antwort-noetig", "angebote"],
    badges: ["dringend", "angebot", "antwort-empfohlen"],
    isToday: true,
    isThisWeek: true,
    analysis: {
      summary:
        "Weber & Co. GmbH fordert ein verbindliches Angebot für 45 Arbeitsplätze an. Deadline: Freitag. Budgetrahmen ca. 85.000 €.",
      tasks: [
        "Angebot erstellen",
        "Lieferkosten kalkulieren",
        "Antwort versenden",
      ],
      appointments: [],
      offers: ["Büroausstattung — 45 Arbeitsplätze", "Geschätzter Wert: 85.000 €"],
      offerDetail: {
        company: "Weber & Co. GmbH",
        amount: "ca. 85.000 €",
        deadline: "Freitag, 17:00 Uhr",
      },
      recommendation:
        "Ich würde diese Anfrage heute beantworten. Der Kunde erwartet bis Freitag ein verbindliches Angebot.",
      detectedAppointment: {
        weekday: "Dienstag",
        time: "14:00 Uhr",
        company: "Weber & Co.",
        title: "Besprechung Angebot",
        date: "2026-07-07",
        contact: "Thomas Müller",
        type: "termin",
      },
      suggestedReply:
        "Sehr geehrter Herr Müller, vielen Dank für Ihre Anfrage. Wir erstellen Ihnen bis Freitag ein detailliertes Angebot inkl. Lieferung und Montage. Bei Rückfragen stehe ich gerne zur Verfügung.",
    },
  },
  {
    id: "2",
    sender: "Sandra Klein",
    company: "Schmidt GmbH",
    subject: "Terminvorschlag: Besprechung Q2-Planung",
    preview:
      "Hallo Martina, könnten wir uns nächste Woche Dienstag um 14:00 Uhr zu unserer Q2-Planung austauschen? Alternativ biete ich Donnerstag 10:00 Uhr an…",
    time: "08:15",
    unread: true,
    priority: "mittel",
    categories: ["heute", "neu", "termine", "antwort-noetig"],
    badges: ["termin", "antwort-empfohlen"],
    isToday: true,
    isThisWeek: true,
    analysis: {
      summary:
        "Sandra Klein schlägt einen Termin zur Q2-Planung vor: Dienstag 14:00 oder Donnerstag 10:00 Uhr.",
      tasks: ["Termin bestätigen oder Alternativvorschlag senden"],
      appointments: [
        "Dienstag, 14:00 Uhr — Q2-Planung",
        "Alternativ: Donnerstag, 10:00 Uhr",
      ],
      offers: [],
      detectedAppointment: {
        weekday: "Dienstag",
        time: "14:00 Uhr",
        company: "Schmidt GmbH",
        title: "Q2-Planung",
        date: "2026-07-07",
        contact: "Sandra Klein",
        type: "telefonat",
      },
      suggestedReply:
        "Hallo Sandra, Dienstag um 14:00 Uhr passt mir sehr gut. Ich sende Ihnen gleich eine Kalendereinladung. Freue mich auf unser Gespräch!",
    },
  },
  {
    id: "3",
    sender: "Finanzamt München",
    company: "Finanzamt München",
    subject: "Steuerbescheid 2024 — Einspruchsfrist beachten",
    preview:
      "Ihr Steuerbescheid für das Veranlagungsjahr 2024 steht im Elster-Portal zur Verfügung. Die Einspruchsfrist beträgt einen Monat…",
    time: "07:30",
    unread: false,
    priority: "hoch",
    categories: ["heute", "wichtig", "rechnungen"],
    badges: ["dringend", "rechnung", "antwort-empfohlen"],
    isToday: true,
    isThisWeek: true,
    analysis: {
      summary:
        "Steuerbescheid 2024 im Elster-Portal verfügbar. Einspruchsfrist: 4 Wochen ab Zustellung.",
      tasks: [
        "Steuerbescheid im Elster-Portal prüfen",
        "Einspruchsfrist im Kalender eintragen",
        "Ggf. Steuerberater informieren",
      ],
      appointments: [],
      offers: [],
      suggestedReply:
        "Sehr geehrte Damen und Herren, vielen Dank für die Zustellung. Wir werden den Bescheid umgehend prüfen und uns bei Rückfragen melden.",
    },
  },
  {
    id: "4",
    sender: "Markus Fischer",
    company: "Müller Logistik AG",
    subject: "Rechnung Nr. 2024-0847 — Zahlungserinnerung",
    preview:
      "Guten Tag, wir möchten Sie freundlich daran erinnern, dass die Rechnung Nr. 2024-0847 über 4.280,00 € seit 14 Tagen überfällig ist…",
    time: "Gestern",
    unread: true,
    priority: "mittel",
    categories: ["neu", "rechnungen", "antwort-noetig"],
    badges: ["rechnung", "antwort-empfohlen"],
    isToday: false,
    isThisWeek: true,
    analysis: {
      summary:
        "Zahlungserinnerung für Rechnung 2024-0847 über 4.280,00 € — 14 Tage überfällig.",
      tasks: [
        "Rechnung in Buchhaltung prüfen",
        "Zahlungsstatus klären",
        "Antwort an Müller Logistik senden",
      ],
      appointments: [],
      offers: [],
      suggestedReply:
        "Sehr geehrter Herr Fischer, vielen Dank für Ihre Erinnerung. Die Zahlung wurde heute veranlasst und sollte in 2–3 Werktagen eingehen.",
    },
  },
  {
    id: "5",
    sender: "Julia Hoffmann",
    company: "TechStart AG",
    subject: "Kooperationsanfrage: Gemeinsames Pilotprojekt KI",
    preview:
      "Liebe Martina, TechStart AG plant ein Pilotprojekt im Bereich KI-gestützte Büroprozesse und würde HELPY Office KI als Partner evaluieren…",
    time: "Gestern",
    unread: true,
    priority: "hoch",
    categories: ["neu", "wichtig", "angebote", "antwort-noetig"],
    badges: ["dringend", "angebot", "antwort-empfohlen"],
    isToday: false,
    isThisWeek: true,
    analysis: {
      summary:
        "TechStart AG interessiert sich für eine Kooperation/Pilotprojekt mit HELPY Office KI im Bereich KI-Büroprozesse.",
      tasks: [
        "Kooperationsunterlagen vorbereiten",
        "Termin für Erstgespräch vorschlagen",
        "NDA prüfen lassen",
      ],
      appointments: [],
      offers: ["Pilotprojekt KI-Büroprozesse — TechStart AG"],
      offerDetail: {
        company: "TechStart AG",
        amount: "Auf Anfrage",
        deadline: "Diese Woche",
      },
      recommendation:
        "Ich würde heute antworten und einen Termin für ein Erstgespräch vorschlagen.",
      suggestedReply:
        "Liebe Julia, vielen Dank für dein Interesse an HELPY Office KI. Ein Pilotprojekt klingt spannend — gerne schlage ich dir einen Termin für ein Erstgespräch vor.",
    },
  },
  {
    id: "6",
    sender: "Amazon Business",
    company: "Amazon Business",
    subject: "Ihre Bestellung #304-9284751 wurde versandt",
    preview:
      "Gute Nachrichten! Ihre Bestellung mit 12 Artikeln wurde versandt und voraussichtlich am Mittwoch zugestellt. Sendungsverfolgung…",
    time: "Gestern",
    unread: false,
    priority: "niedrig",
    categories: ["archiv"],
    badges: ["termin"],
    isToday: false,
    isThisWeek: true,
    analysis: {
      summary: "Bestellbestätigung — Lieferung voraussichtlich Mittwoch.",
      tasks: [],
      appointments: ["Mittwoch — voraussichtliche Lieferung"],
      offers: [],
      suggestedReply: "",
    },
  },
  {
    id: "7",
    sender: "Dr. Werner",
    company: "Kanzlei Werner & Partner",
    subject: "Vertragsentwurf zur Prüfung — Projekt Alpha",
    preview:
      "Sehr geehrte Frau Traudt, anbei der überarbeitete Vertragsentwurf für Projekt Alpha. Bitte prüfen Sie die Klauseln zu Haftung und Laufzeit…",
    time: "Mo",
    unread: true,
    priority: "hoch",
    categories: ["neu", "wichtig", "antwort-noetig"],
    badges: ["dringend", "antwort-empfohlen"],
    isToday: false,
    isThisWeek: true,
    analysis: {
      summary:
        "Überarbeiteter Vertragsentwurf für Projekt Alpha — Fokus auf Haftungs- und Laufzeitklauseln.",
      tasks: [
        "Haftungsklauseln mit Anwalt besprechen",
        "Rückmeldung bis Mittwoch",
      ],
      appointments: [],
      offers: [],
      suggestedReply:
        "Sehr geehrter Herr Dr. Werner, vielen Dank für den Entwurf. Wir prüfen die Klauseln und melden uns bis Mittwoch mit unserem Feedback.",
    },
  },
  {
    id: "8",
    sender: "HR Team",
    company: "Intern",
    subject: "Urlaubsantrag genehmigt — 15.–22. Juli 2026",
    preview:
      "Hallo Martina, dein Urlaubsantrag für den 15.–22. Juli 2026 wurde genehmigt. Bitte hinterlege eine Vertretung im System…",
    time: "Mo",
    unread: false,
    priority: "niedrig",
    categories: ["archiv"],
    badges: ["antwort-fertig"],
    isToday: false,
    isThisWeek: true,
    analysis: {
      summary: "Urlaub vom 15.–22. Juli 2026 genehmigt. Vertretung hinterlegen.",
      tasks: ["Vertretung im System hinterlegen", "Out-of-Office einrichten"],
      appointments: ["15.–22. Juli 2026 — Urlaub"],
      offers: [],
      suggestedReply: "",
    },
  },
  {
    id: "9",
    sender: "Klaus Berger",
    company: "Berger Bau GmbH",
    subject: "Nachfrage zu Angebot Nr. A-2024-112",
    preview:
      "Guten Tag, wir haben Ihr Angebot erhalten und hätten noch Fragen zur Garantie und Wartung. Können Sie uns kurze Auskunft geben?",
    time: "Mo",
    unread: true,
    priority: "mittel",
    categories: ["neu", "angebote", "antwort-noetig"],
    badges: ["angebot", "antwort-empfohlen"],
    isToday: false,
    isThisWeek: true,
    analysis: {
      summary:
        "Nachfrage zu Angebot A-2024-112 — Garantie- und Wartungsbedingungen.",
      tasks: [
        "Angebot A-2024-112 ergänzen",
      ],
      appointments: [],
      offers: ["Angebot Nr. A-2024-112 — Berger Bau GmbH"],
      suggestedReply:
        "Sehr geehrter Herr Berger, vielen Dank für Ihre Nachfrage. Garantie beträgt 24 Monate, Wartung ist optional als Servicevertrag buchbar. Details sende ich Ihnen anbei.",
    },
  },
  {
    id: "10",
    sender: "LinkedIn",
    company: "LinkedIn",
    subject: "Sie haben 3 neue Kontaktanfragen",
    preview:
      "3 Personen aus Ihrem Netzwerk möchten sich mit Ihnen verbinden, darunter Michael Braun (Geschäftsführer, Braun Consulting)…",
    time: "So",
    unread: false,
    priority: "niedrig",
    categories: ["archiv"],
    badges: [],
    isToday: false,
    isThisWeek: false,
    analysis: {
      summary: "3 neue LinkedIn-Kontaktanfragen, u.a. Michael Braun (Braun Consulting).",
      tasks: [],
      appointments: [],
      offers: [],
      suggestedReply: "",
    },
  },
  {
    id: "11",
    sender: "Petra Schulz",
    company: "Schulz Marketing",
    subject: "Rechnungsstellung Projekt Alpha — Abschlussphase",
    preview:
      "Hallo Martina, Projekt Alpha nähert sich der Abschlussphase. Anbei unsere Schlussrechnung über 12.450,00 € netto. Zahlungsziel: 14 Tage…",
    time: "So",
    unread: true,
    priority: "mittel",
    categories: ["neu", "rechnungen"],
    badges: ["rechnung", "antwort-empfohlen"],
    isToday: false,
    isThisWeek: true,
    analysis: {
      summary:
        "Schlussrechnung Projekt Alpha: 12.450,00 € netto, Zahlungsziel 14 Tage.",
      tasks: [
        "Rechnung prüfen und freigeben",
        "Zahlung in Buchhaltung anstoßen",
      ],
      appointments: [],
      offers: [],
      suggestedReply:
        "Hallo Petra, vielen Dank für die Rechnung. Wir prüfen diese und veranlassen die Zahlung innerhalb der nächsten Tage.",
    },
  },
  {
    id: "12",
    sender: "Calendly",
    company: "Calendly",
    subject: "Terminbestätigung: Workshop Digitalisierung",
    preview:
      "Ihr Termin «Workshop Digitalisierung» mit Anna Richter ist bestätigt für Donnerstag, 10. Juli 2026, 09:00–11:00 Uhr (Zoom)…",
    time: "So",
    unread: false,
    priority: "niedrig",
    categories: ["termine", "heute"],
    badges: ["termin"],
    isToday: true,
    isThisWeek: true,
    analysis: {
      summary:
        "Workshop Digitalisierung mit Anna Richter — Donnerstag, 10.07.2026, 09:00–11:00 Uhr via Zoom.",
      tasks: ["Zoom-Link prüfen", "Agenda vorbereiten"],
      appointments: [
        "Donnerstag, 10.07.2026, 09:00–11:00 — Workshop Digitalisierung",
      ],
      offers: [],
      suggestedReply: "",
    },
  },
];

export function filterByChip(emails: Email[], chip: ChipFilter): Email[] {
  switch (chip) {
    case "alle":
      return emails;
    case "ungelesen":
      return emails.filter((e) => e.unread);
    case "heute":
      return emails.filter((e) => e.isToday);
    case "diese-woche":
      return emails.filter((e) => e.isThisWeek);
    case "mit-termin":
      return emails.filter((e) => e.badges.includes("termin"));
    case "mit-angebot":
      return emails.filter((e) => e.badges.includes("angebot"));
    case "mit-rechnung":
      return emails.filter((e) => e.badges.includes("rechnung"));
    case "dringend":
      return emails.filter((e) => e.badges.includes("dringend"));
    default:
      return emails;
  }
}

export function getChipCounts(emails: Email[]): Record<ChipFilter, number> {
  const chips: ChipFilter[] = [
    "alle",
    "ungelesen",
    "heute",
    "diese-woche",
    "mit-termin",
    "mit-angebot",
    "mit-rechnung",
    "dringend",
  ];

  return Object.fromEntries(
    chips.map((c) => [c, filterByChip(emails, c).length])
  ) as Record<ChipFilter, number>;
}

export function filterEmails(
  emails: Email[],
  filter: InboxFilter
): Email[] {
  if (filter === "archiv") {
    return emails.filter((e) => e.categories.includes("archiv"));
  }
  return emails.filter((e) => e.categories.includes(filter));
}

export function getFilterCounts(emails: Email[]): Record<InboxFilter, number> {
  const filters: InboxFilter[] = [
    "heute",
    "neu",
    "wichtig",
    "antwort-noetig",
    "angebote",
    "rechnungen",
    "termine",
    "archiv",
  ];

  return Object.fromEntries(
    filters.map((f) => [f, filterEmails(emails, f).length])
  ) as Record<InboxFilter, number>;
}
