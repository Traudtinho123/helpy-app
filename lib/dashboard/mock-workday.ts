import type { LucideIcon } from "lucide-react";
import {
  CalendarPlus,
  FileText,
  Inbox,
  ListChecks,
  Mail,
  UserPlus,
  Users,
} from "lucide-react";

export type HelpyStatusMetric = {
  label: string;
  value: number;
  icon: LucideIcon;
};

export type TodayPriority = {
  rank: number;
  title: string;
  href?: string;
};

export type QuickAction = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const workdayGreeting = {
  headline: "Guten Morgen 👋",
  subline: "Ich habe deinen Arbeitstag bereits vorbereitet.",
};

export const helpyStatusCard = {
  title: "HELPY war heute schon fleißig.",
  metrics: [
    { label: "E-Mails analysiert", value: 18, icon: Mail },
    { label: "Termine erkannt", value: 4, icon: CalendarPlus },
    { label: "Angebote vorbereitet", value: 2, icon: FileText },
    { label: "Neuer Kunde erkannt", value: 1, icon: UserPlus },
    { label: "Aufgaben priorisiert", value: 3, icon: ListChecks },
  ] satisfies HelpyStatusMetric[],
};

export const todayPriorities: TodayPriority[] = [
  { rank: 1, title: "Angebot Weber & Co. versenden", href: "/angebote" },
  { rank: 2, title: "Telefonat mit Sandra Klein vorbereiten", href: "/kalender" },
  {
    rank: 3,
    title: "Termin mit Immobilienprojekt bestätigen",
    href: "/kalender",
  },
  { rank: 4, title: "Rückfrage von Müller GmbH beantworten", href: "/vorgaenge" },
];

export const todayProgress = {
  percent: 60,
  message: "Du bist gut im Plan.",
};

export const quickActions: QuickAction[] = [
  { label: "Vorgänge öffnen", href: "/vorgaenge", icon: Inbox },
  { label: "Neues Angebot", href: "/angebote", icon: FileText },
  { label: "Termin erstellen", href: "/kalender", icon: CalendarPlus },
  { label: "Kundenakte öffnen", href: "/kunden", icon: Users },
];

export const workdayHelpyPanel = {
  greeting: "Hallo 👋",
  recommendation:
    "Ich empfehle dir, zuerst das Angebot von Weber & Co. zu versenden. Der Kunde wartet bereits seit 3 Tagen.",
  inputLabel: "Was soll ich als Nächstes tun?",
  inputPlaceholder: "Frag HELPY…",
};
