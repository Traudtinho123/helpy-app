export type CalendarEventType =
  | "angebot"
  | "telefonat"
  | "besichtigung"
  | "termin";

export type CalendarEvent = {
  id: string;
  time: string;
  endTime?: string;
  title: string;
  subtitle?: string;
  type: CalendarEventType;
  helpyHint: string;
  date: string;
  sourceEmailId?: string;
  location?: string;
  participants?: string[];
  calendarName?: string;
  sourcePlatform?: "apple" | "google";
  confirmationStatus?: "bestaetigt";
  vorgangId?: string;
  externalEventId?: string;
};

export type CalendarDaySummary = {
  appointments: number;
  tasks: number;
  offers: number;
};

export const todaySummary: CalendarDaySummary = {
  appointments: 4,
  tasks: 2,
  offers: 1,
};

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: "1",
    time: "09:00",
    title: "Angebot fertigstellen",
    subtitle: "Weber & Co. GmbH",
    type: "angebot",
    helpyHint:
      "Ich empfehle, das Angebot vor dem Telefonat zu versenden.",
    date: "2026-07-06",
  },
  {
    id: "2",
    time: "10:30",
    title: "Telefonat",
    subtitle: "Sandra Klein",
    type: "telefonat",
    helpyHint:
      "Beim letzten Gespräch interessierte sie sich für einen Wartungsvertrag.",
    date: "2026-07-06",
  },
  {
    id: "3",
    time: "14:00",
    title: "Immobilienbesichtigung",
    subtitle: "ImmoService Richter — Projekt Nord",
    type: "besichtigung",
    helpyHint: "Adresse wurde bereits übernommen.",
    date: "2026-07-06",
  },
  {
    id: "4",
    time: "16:30",
    title: "Steuerberater",
    subtitle: "Monatsbesprechung",
    type: "termin",
    helpyHint: "Bitte Rechnung Mai vorbereiten.",
    date: "2026-07-06",
  },
];

export const todaySidebarEvents = [
  { time: "09:00", label: "Angebot Weber & Co.", id: "1" },
  { time: "10:30", label: "Telefonat Sandra Klein", id: "2" },
  { time: "14:00", label: "Besichtigung Immobilienprojekt", id: "3" },
  { time: "16:30", label: "Steuerberater", id: "4" },
] as const;

export const helpyCalendarInsights = {
  todayImportant: [
    "Angebot Weber",
    "Telefonat Sandra",
    "Immobilienbesichtigung",
  ],
  freeTime: { from: "11:15", to: "13:30" },
  detected: [
    "2 Termine stammen aus E-Mails",
    "1 Termin enthält eine Angebotsanfrage",
    "1 Wiedervorlage fehlt",
  ],
  suggestion:
    "Wenn du das Angebot vor 09:30 versendest, kannst du offene Fragen direkt im Telefonat klären.",
};

export const eventTypeStyles: Record<
  CalendarEventType,
  { dot: string; badge: string; ring: string }
> = {
  angebot: {
    dot: "bg-[#2563EB]",
    badge: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
    ring: "border-l-[#2563EB]",
  },
  telefonat: {
    dot: "bg-[#10B981]",
    badge: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
    ring: "border-l-[#10B981]",
  },
  besichtigung: {
    dot: "bg-[#F59E0B]",
    badge: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
    ring: "border-l-[#F59E0B]",
  },
  termin: {
    dot: "bg-[#7C3AED]",
    badge: "border-[#E9D5FF] bg-[#FAF5FF] text-[#7C3AED]",
    ring: "border-l-[#7C3AED]",
  },
};

export const daysWithEvents = [3, 6, 8, 10, 14, 15, 22, 28];

export function getEventsForDate(date: string): CalendarEvent[] {
  return mockCalendarEvents.filter((e) => e.date === date);
}
