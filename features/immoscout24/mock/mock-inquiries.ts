export type InquiryPriority = "hoch" | "mittel" | "niedrig";

export type InquiryStatus =
  | "neu"
  | "in_bearbeitung"
  | "besichtigung_geplant"
  | "erledigt";

export type InquiryFilter = InquiryStatus | "alle";

export type InquiryDetection =
  | "besichtigung"
  | "kauf"
  | "miete"
  | "rueckruf"
  | "neu";

export type HelpyInquiryInsight = {
  detections: InquiryDetection[];
  recommendation: string;
  summary: string;
};

export type ImmoScoutInquiry = {
  id: string;
  name: string;
  objekt: string;
  kauf: boolean;
  miete: boolean;
  besichtigung: boolean;
  telefon: string;
  email: string;
  wunschdatum: string;
  prioritaet: InquiryPriority;
  status: InquiryStatus;
  receivedAt: string;
  receivedLabel: string;
  message: string;
  helpy: HelpyInquiryInsight;
};

export const priorityLabels: Record<InquiryPriority, string> = {
  hoch: "Hoch",
  mittel: "Mittel",
  niedrig: "Niedrig",
};

export const priorityStyles: Record<
  InquiryPriority,
  { badge: string; dot: string }
> = {
  hoch: {
    badge: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
    dot: "bg-[#DC2626]",
  },
  mittel: {
    badge: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
    dot: "bg-[#F59E0B]",
  },
  niedrig: {
    badge: "border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]",
    dot: "bg-[#94A3B8]",
  },
};

export const statusLabels: Record<InquiryStatus, string> = {
  neu: "Neu",
  in_bearbeitung: "In Bearbeitung",
  besichtigung_geplant: "Besichtigung geplant",
  erledigt: "Erledigt",
};

export const statusStyles: Record<
  InquiryStatus,
  { badge: string; dot: string }
> = {
  neu: {
    badge: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
    dot: "bg-[#2563EB]",
  },
  in_bearbeitung: {
    badge: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
    dot: "bg-[#F59E0B]",
  },
  besichtigung_geplant: {
    badge: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
    dot: "bg-[#10B981]",
  },
  erledigt: {
    badge: "border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]",
    dot: "bg-[#94A3B8]",
  },
};

export const filterLabels: Record<InquiryFilter, string> = {
  alle: "Alle",
  neu: "Neu",
  in_bearbeitung: "In Bearbeitung",
  besichtigung_geplant: "Besichtigung",
  erledigt: "Erledigt",
};

export const detectionLabels: Record<InquiryDetection, string> = {
  besichtigung: "Besichtigungswunsch",
  kauf: "Kaufinteresse",
  miete: "Mietinteresse",
  rueckruf: "Rückruf gewünscht",
  neu: "Neue Anfrage",
};

export const mockInquiries: ImmoScoutInquiry[] = [
  {
    id: "is-001",
    name: "Thomas Müller",
    objekt: "4.5-Zi-Wohnung, Seefeld Zürich",
    kauf: false,
    miete: false,
    besichtigung: true,
    telefon: "+41 79 123 45 67",
    email: "thomas.mueller@email.ch",
    wunschdatum: "12.07.2026, 14:00",
    prioritaet: "hoch",
    status: "neu",
    receivedAt: "2026-07-07T08:15:00",
    receivedLabel: "Heute, 08:15",
    message:
      "Guten Tag, ich interessiere mich für die Wohnung und würde gerne am Freitag eine Besichtigung vereinbaren.",
    helpy: {
      detections: ["besichtigung", "neu"],
      summary: "Besichtigungswunsch für Seefeld-Wohnung",
      recommendation:
        "Ich empfehle, zuerst diese Anfrage zu bearbeiten — der Interessent wünscht eine Besichtigung diese Woche.",
    },
  },
  {
    id: "is-002",
    name: "Sandra Weber",
    objekt: "Einfamilienhaus, Küsnacht",
    kauf: true,
    miete: false,
    besichtigung: false,
    telefon: "+41 78 987 65 43",
    email: "s.weber@business.ch",
    wunschdatum: "—",
    prioritaet: "mittel",
    status: "in_bearbeitung",
    receivedAt: "2026-07-06T16:42:00",
    receivedLabel: "Gestern, 16:42",
    message:
      "Wir suchen ein Einfamilienhaus in Küsnacht zum Kauf. Bitte senden Sie uns weitere Unterlagen.",
    helpy: {
      detections: ["kauf", "neu"],
      summary: "Kaufinteresse Einfamilienhaus Küsnacht",
      recommendation:
        "Ich habe bereits alles für dich vorbereitet — Unterlagen und Antwortentwurf liegen bereit.",
    },
  },
  {
    id: "is-003",
    name: "Marco Bianchi",
    objekt: "2.5-Zi-Wohnung, Oerlikon",
    kauf: false,
    miete: true,
    besichtigung: false,
    telefon: "+41 76 555 12 34",
    email: "marco.b@outlook.com",
    wunschdatum: "01.08.2026",
    prioritaet: "mittel",
    status: "neu",
    receivedAt: "2026-07-07T07:30:00",
    receivedLabel: "Heute, 07:30",
    message:
      "Ich suche ab August eine Mietwohnung in Oerlikon. Ist die Wohnung noch verfügbar?",
    helpy: {
      detections: ["miete", "neu"],
      summary: "Mietinteresse Oerlikon",
      recommendation:
        "Verfügbarkeit prüfen und Mietdetails zusenden — Einzugswunsch August.",
    },
  },
  {
    id: "is-004",
    name: "Elena Rossi",
    objekt: "Attikawohnung, Enge Zürich",
    kauf: true,
    miete: false,
    besichtigung: true,
    telefon: "+41 79 444 88 99",
    email: "elena.rossi@gmail.com",
    wunschdatum: "15.07.2026, 10:00",
    prioritaet: "hoch",
    status: "besichtigung_geplant",
    receivedAt: "2026-07-05T11:20:00",
    receivedLabel: "05.07., 11:20",
    message:
      "Sehr geehrte Damen und Herren, die Attikawohnung interessiert mich sehr. Kauf und Besichtigung wären möglich.",
    helpy: {
      detections: ["besichtigung", "kauf"],
      summary: "Kauf + Besichtigung Attika Enge",
      recommendation:
        "Besichtigung ist geplant — ich habe alle Unterlagen für das Gespräch vorbereitet.",
    },
  },
  {
    id: "is-005",
    name: "Peter Huber",
    objekt: "Bürofläche, Hardbrücke",
    kauf: false,
    miete: true,
    besichtigung: false,
    telefon: "+41 44 333 22 11",
    email: "p.huber@firma.ch",
    wunschdatum: "—",
    prioritaet: "niedrig",
    status: "neu",
    receivedAt: "2026-07-07T06:00:00",
    receivedLabel: "Heute, 06:00",
    message: "Bitte rufen Sie mich zurück bezüglich der Bürofläche.",
    helpy: {
      detections: ["rueckruf", "miete", "neu"],
      summary: "Rückrufwunsch Bürofläche Hardbrücke",
      recommendation:
        "Rückruf heute Vormittag empfohlen — Interessent wartet auf Kontakt.",
    },
  },
  {
    id: "is-006",
    name: "Anna Keller",
    objekt: "3.5-Zi-Wohnung, Wiedikon",
    kauf: true,
    miete: false,
    besichtigung: false,
    telefon: "+41 79 111 22 33",
    email: "anna.keller@email.ch",
    wunschdatum: "—",
    prioritaet: "mittel",
    status: "erledigt",
    receivedAt: "2026-07-04T09:15:00",
    receivedLabel: "04.07., 09:15",
    message: "Kaufinteresse für die Wohnung in Wiedikon. Finanzierung steht.",
    helpy: {
      detections: ["kauf"],
      summary: "Kaufinteresse Wiedikon — erledigt",
      recommendation: "Anfrage wurde bearbeitet und als erledigt markiert.",
    },
  },
  {
    id: "is-007",
    name: "Luca Fontana",
    objekt: "Studio, Altstetten",
    kauf: false,
    miete: true,
    besichtigung: true,
    telefon: "+41 78 666 77 88",
    email: "luca.fontana@icloud.com",
    wunschdatum: "10.07.2026, 17:30",
    prioritaet: "hoch",
    status: "neu",
    receivedAt: "2026-07-07T09:45:00",
    receivedLabel: "Heute, 09:45",
    message:
      "Studio in Altstetten zur Miete — Besichtigung am Donnerstagabend wäre ideal.",
    helpy: {
      detections: ["besichtigung", "miete", "neu"],
      summary: "Miete + Besichtigung Studio Altstetten",
      recommendation:
        "Ich habe neue Immobilienanfragen erkannt — Donnerstagabend passt für eine Besichtigung.",
    },
  },
];

export function filterInquiries(
  inquiries: ImmoScoutInquiry[],
  filter: InquiryFilter
): ImmoScoutInquiry[] {
  if (filter === "alle") return inquiries;
  return inquiries.filter((i) => i.status === filter);
}

export function getFilterCounts(
  inquiries: ImmoScoutInquiry[]
): Record<InquiryFilter, number> {
  return {
    alle: inquiries.length,
    neu: inquiries.filter((i) => i.status === "neu").length,
    in_bearbeitung: inquiries.filter((i) => i.status === "in_bearbeitung")
      .length,
    besichtigung_geplant: inquiries.filter(
      (i) => i.status === "besichtigung_geplant"
    ).length,
    erledigt: inquiries.filter((i) => i.status === "erledigt").length,
  };
}

export function searchInquiries(
  inquiries: ImmoScoutInquiry[],
  query: string
): ImmoScoutInquiry[] {
  const q = query.trim().toLowerCase();
  if (!q) return inquiries;
  return inquiries.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.objekt.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q)
  );
}
