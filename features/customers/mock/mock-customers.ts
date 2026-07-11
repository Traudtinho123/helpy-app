export type CustomerStatus =
  | "neu"
  | "aktiv"
  | "interessent"
  | "bestandskunde";

export type CustomerFilter = CustomerStatus | "alle";

export type TimelineEntryType =
  | "email"
  | "telefonat"
  | "termin"
  | "angebot"
  | "rechnung";

export type TimelineEntry = {
  id: string;
  type: TimelineEntryType;
  title: string;
  description?: string;
  date: string;
  time?: string;
};

export type HelpyCustomerInsight = {
  emailCount: number;
  offerCount: number;
  invoiceCount: number;
  lastContactDays: number;
  impression: string;
  recommendation: string;
};

export type Customer = {
  id: string;
  company: string;
  logoInitials: string;
  logoColor: string;
  contactPerson: string;
  role: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  tags: string[];
  status: CustomerStatus;
  lastActivity: string;
  lastActivityLabel: string;
  timeline: TimelineEntry[];
  helpy: HelpyCustomerInsight;
  /** Lead-Score 1–10 (regelbasiert, täglich/stündlich aktualisiert). */
  leadScore?: number;
  leadScoreUpdatedAt?: string;
};

export const statusLabels: Record<CustomerStatus, string> = {
  neu: "Neuer Kunde",
  aktiv: "Aktiv",
  interessent: "Interessent",
  bestandskunde: "Bestandskunde",
};

export const statusStyles: Record<
  CustomerStatus,
  { badge: string; dot: string }
> = {
  neu: {
    badge: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
    dot: "bg-[#2563EB]",
  },
  aktiv: {
    badge: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
    dot: "bg-[#10B981]",
  },
  interessent: {
    badge: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
    dot: "bg-[#F59E0B]",
  },
  bestandskunde: {
    badge: "border-[#E9D5FF] bg-[#FAF5FF] text-[#7C3AED]",
    dot: "bg-[#7C3AED]",
  },
};

export const timelineTypeStyles: Record<
  TimelineEntryType,
  { label: string; dot: string; icon: string }
> = {
  email: { label: "E-Mail", dot: "bg-[#2563EB]", icon: "mail" },
  telefonat: { label: "Telefonat", dot: "bg-[#10B981]", icon: "phone" },
  termin: { label: "Termin", dot: "bg-[#7C3AED]", icon: "calendar" },
  angebot: { label: "Angebot", dot: "bg-[#F59E0B]", icon: "file" },
  rechnung: { label: "Rechnung", dot: "bg-[#64748B]", icon: "receipt" },
};

export const filterLabels: Record<CustomerFilter, string> = {
  alle: "Alle",
  neu: "Neue Kunden",
  aktiv: "Aktive Kunden",
  interessent: "Interessenten",
  bestandskunde: "Bestandskunden",
};

export const mockCustomers: Customer[] = [
  {
    id: "1",
    company: "Weber & Co. GmbH",
    logoInitials: "WC",
    logoColor: "from-[#2563EB] to-[#3B82F6]",
    contactPerson: "Thomas Müller",
    role: "Geschäftsführer",
    phone: "+49 89 1234 5678",
    email: "thomas.mueller@weber-co.de",
    address: "Maximilianstraße 12, 80539 München",
    notes:
      "Langjähriger Geschäftspartner. Bevorzugt Kommunikation per E-Mail. Plant Expansion in Q3 — Angebot für Wartungsvertrag offen.",
    tags: ["Premium", "Angebot offen", "München"],
    status: "aktiv",
    lastActivity: "2026-06-28",
    lastActivityLabel: "vor 8 Tagen",
    timeline: [
      {
        id: "t1",
        type: "email",
        title: "Anfrage Büroausstattung",
        description: "Thomas Müller fragt nach Angebot für 12 Arbeitsplätze.",
        date: "2026-07-06",
        time: "09:14",
      },
      {
        id: "t2",
        type: "angebot",
        title: "Angebot #2026-0847 erstellt",
        description: "Summe: 24.800 € · Gültig bis 11.07.2026",
        date: "2026-07-05",
        time: "16:30",
      },
      {
        id: "t3",
        type: "telefonat",
        title: "Rückfrage Lieferzeit",
        description: "15 Min. · Thomas wünscht Express-Lieferung",
        date: "2026-06-28",
        time: "11:00",
      },
      {
        id: "t4",
        type: "termin",
        title: "Besprechung Angebot",
        description: "Dienstag, 14:00 Uhr · Weber & Co.",
        date: "2026-06-25",
        time: "14:00",
      },
      {
        id: "t5",
        type: "rechnung",
        title: "Rechnung #RE-2026-0312 bezahlt",
        description: "3.420 € · Überweisung erhalten",
        date: "2026-06-18",
      },
      {
        id: "t6",
        type: "email",
        title: "Bestellbestätigung",
        description: "Auftrag für Büromöbel bestätigt.",
        date: "2026-06-10",
        time: "08:45",
      },
      {
        id: "t7",
        type: "angebot",
        title: "Angebot #2026-0791 versendet",
        description: "Summe: 18.200 € · Angenommen",
        date: "2026-06-05",
      },
      {
        id: "t8",
        type: "rechnung",
        title: "Rechnung #RE-2026-0288 erstellt",
        description: "2.890 € · Zahlungsziel 14 Tage",
        date: "2026-05-22",
      },
    ],
    helpy: {
      emailCount: 12,
      offerCount: 4,
      invoiceCount: 2,
      lastContactDays: 8,
      impression:
        "Dieser Kunde antwortet meistens innerhalb eines Werktages.",
      recommendation: "Ich würde mich diese Woche nochmals melden.",
    },
  },
  {
    id: "2",
    company: "Schmidt GmbH",
    logoInitials: "SG",
    logoColor: "from-[#10B981] to-[#34D399]",
    contactPerson: "Sandra Klein",
    role: "Einkaufsleiterin",
    phone: "+49 30 9876 5432",
    email: "sandra.klein@schmidt-gmbh.de",
    address: "Friedrichstraße 88, 10117 Berlin",
    notes: "Interessiert an Wartungsvertrag. Q2-Planung steht an.",
    tags: ["Berlin", "Wartung", "Telefonat geplant"],
    status: "interessent",
    lastActivity: "2026-07-05",
    lastActivityLabel: "gestern",
    timeline: [
      {
        id: "t1",
        type: "email",
        title: "Terminvorschlag Q2-Planung",
        description: "Sandra schlägt Dienstag 14:00 vor.",
        date: "2026-07-05",
        time: "14:22",
      },
      {
        id: "t2",
        type: "telefonat",
        title: "Erstgespräch Wartungsvertrag",
        description: "22 Min. · Bedarf für 3 Standorte",
        date: "2026-06-20",
        time: "10:30",
      },
      {
        id: "t3",
        type: "email",
        title: "Erstanfrage",
        description: "Anfrage über Website-Formular.",
        date: "2026-06-15",
        time: "09:00",
      },
    ],
    helpy: {
      emailCount: 5,
      offerCount: 0,
      invoiceCount: 0,
      lastContactDays: 1,
      impression:
        "Interessent mit hohem Potenzial — reagiert schnell auf Terminvorschläge.",
      recommendation:
        "Termin für Dienstag bestätigen und Wartungsangebot vorbereiten.",
    },
  },
  {
    id: "3",
    company: "ImmoService Richter",
    logoInitials: "IR",
    logoColor: "from-[#F59E0B] to-[#FBBF24]",
    contactPerson: "Markus Richter",
    role: "Projektleiter",
    phone: "+49 40 5555 1234",
    email: "m.richter@immoservice-richter.de",
    address: "Speicherstadt 4, 20457 Hamburg",
    notes: "Immobilienprojekt Nord — Besichtigung geplant.",
    tags: ["Hamburg", "Immobilien", "Besichtigung"],
    status: "aktiv",
    lastActivity: "2026-07-04",
    lastActivityLabel: "vor 2 Tagen",
    timeline: [
      {
        id: "t1",
        type: "termin",
        title: "Immobilienbesichtigung",
        description: "Projekt Nord · Adresse übernommen",
        date: "2026-07-06",
        time: "14:00",
      },
      {
        id: "t2",
        type: "email",
        title: "Projektunterlagen",
        description: "Grundrisse und Fotos angefordert.",
        date: "2026-07-04",
        time: "11:30",
      },
      {
        id: "t3",
        type: "angebot",
        title: "Angebot #2026-0820 versendet",
        description: "Summe: 45.600 € · Ausstehend",
        date: "2026-06-28",
      },
    ],
    helpy: {
      emailCount: 8,
      offerCount: 2,
      invoiceCount: 1,
      lastContactDays: 2,
      impression: "Projektorientierter Kunde — Termine werden zuverlässig wahrgenommen.",
      recommendation: "Nach der Besichtigung Follow-up-Angebot vorbereiten.",
    },
  },
  {
    id: "4",
    company: "TechStart Solutions",
    logoInitials: "TS",
    logoColor: "from-[#7C3AED] to-[#A78BFA]",
    contactPerson: "Lisa Wagner",
    role: "CEO",
    phone: "+49 221 4444 7890",
    email: "lisa@techstart-solutions.de",
    address: "Mediapark 8, 50670 Köln",
    notes: "Neuer Lead über LinkedIn. Startup mit 25 Mitarbeitern.",
    tags: ["Neu", "Startup", "Köln"],
    status: "neu",
    lastActivity: "2026-07-06",
    lastActivityLabel: "heute",
    timeline: [
      {
        id: "t1",
        type: "email",
        title: "Erstkontakt",
        description: "Lisa Wagner über LinkedIn — Interesse an Büroausstattung.",
        date: "2026-07-06",
        time: "08:30",
      },
    ],
    helpy: {
      emailCount: 1,
      offerCount: 0,
      invoiceCount: 0,
      lastContactDays: 0,
      impression: "Frischer Lead — noch keine Reaktionshistorie vorhanden.",
      recommendation: "Heute noch antworten und Erstgespräch anbieten.",
    },
  },
  {
    id: "5",
    company: "Bauer & Partner KG",
    logoInitials: "BP",
    logoColor: "from-[#64748B] to-[#94A3B8]",
    contactPerson: "Dr. Hans Bauer",
    role: "Senior Partner",
    phone: "+49 711 3333 9999",
    email: "h.bauer@bauer-partner.de",
    address: "Königstraße 45, 70173 Stuttgart",
    notes: "Bestandskunde seit 2019. Jährlicher Rahmenvertrag.",
    tags: ["Bestandskunde", "Rahmenvertrag", "Stuttgart"],
    status: "bestandskunde",
    lastActivity: "2026-06-15",
    lastActivityLabel: "vor 3 Wochen",
    timeline: [
      {
        id: "t1",
        type: "rechnung",
        title: "Rechnung #RE-2026-0298 bezahlt",
        description: "12.400 € · Rahmenvertrag Q2",
        date: "2026-06-15",
      },
      {
        id: "t2",
        type: "angebot",
        title: "Rahmenvertrag 2026 verlängert",
        description: "Summe: 48.000 € / Jahr",
        date: "2026-05-01",
      },
      {
        id: "t3",
        type: "telefonat",
        title: "Quartalsbesprechung",
        description: "45 Min. · Zufriedenheit bestätigt",
        date: "2026-04-10",
        time: "15:00",
      },
      {
        id: "t4",
        type: "email",
        title: "Bestellung Q2",
        description: "Nachbestellung Büromaterial.",
        date: "2026-04-02",
        time: "10:15",
      },
    ],
    helpy: {
      emailCount: 24,
      offerCount: 6,
      invoiceCount: 8,
      lastContactDays: 21,
      impression: "Sehr zuverlässiger Bestandskunde — zahlt pünktlich.",
      recommendation: "Proaktiv Q3-Bedarf ansprechen — letzter Kontakt liegt zurück.",
    },
  },
  {
    id: "6",
    company: "GreenEnergy AG",
    logoInitials: "GE",
    logoColor: "from-[#059669] to-[#10B981]",
    contactPerson: "Anna Hoffmann",
    role: "Procurement Manager",
    phone: "+49 89 7777 2222",
    email: "a.hoffmann@greenenergy.de",
    address: "Leopoldstraße 200, 80804 München",
    notes: "Nachhaltigkeits-Zertifizierung relevant für Angebot.",
    tags: ["Nachhaltigkeit", "München", "Großprojekt"],
    status: "interessent",
    lastActivity: "2026-07-02",
    lastActivityLabel: "vor 4 Tagen",
    timeline: [
      {
        id: "t1",
        type: "email",
        title: "Anfrage nachhaltige Büroausstattung",
        description: "FSC-zertifizierte Möbel für 80 Arbeitsplätze.",
        date: "2026-07-02",
        time: "13:45",
      },
      {
        id: "t2",
        type: "angebot",
        title: "Angebot #2026-0835 in Arbeit",
        description: "Entwurf — noch nicht versendet",
        date: "2026-07-03",
      },
    ],
    helpy: {
      emailCount: 3,
      offerCount: 1,
      invoiceCount: 0,
      lastContactDays: 4,
      impression: "Großes Projekt — Entscheidungsprozess dauert typischerweise 2–3 Wochen.",
      recommendation: "Angebot bis Freitag fertigstellen und Nachhaltigkeitszertifikate beifügen.",
    },
  },
  {
    id: "7",
    company: "MedTech Innovations",
    logoInitials: "MI",
    logoColor: "from-[#DC2626] to-[#EF4444]",
    contactPerson: "Prof. Dr. Stefan Vogel",
    role: "CTO",
    phone: "+49 6221 8888 5555",
    email: "s.vogel@medtech-innovations.de",
    address: "Im Neuenheimer Feld 15, 69120 Heidelberg",
    notes: "Spezialanforderungen Laborausstattung.",
    tags: ["Medizintechnik", "Heidelberg", "Spezial"],
    status: "aktiv",
    lastActivity: "2026-07-01",
    lastActivityLabel: "vor 5 Tagen",
    timeline: [
      {
        id: "t1",
        type: "termin",
        title: "Labortour",
        description: "Vor-Ort-Termin · Anforderungen klären",
        date: "2026-07-01",
        time: "10:00",
      },
      {
        id: "t2",
        type: "email",
        title: "Technische Spezifikationen",
        description: "Detaillierte Anforderungsliste erhalten.",
        date: "2026-06-28",
        time: "16:00",
      },
      {
        id: "t3",
        type: "telefonat",
        title: "Vorgespräch",
        description: "18 Min. · Budgetrahmen besprochen",
        date: "2026-06-20",
        time: "14:30",
      },
    ],
    helpy: {
      emailCount: 7,
      offerCount: 1,
      invoiceCount: 0,
      lastContactDays: 5,
      impression: "Technisch anspruchsvoller Kunde — präzise Kommunikation erforderlich.",
      recommendation: "Angebot mit technischen Details bis Mittwoch vorbereiten.",
    },
  },
];

export function getFilterCounts(
  customers: Customer[]
): Record<CustomerFilter, number> {
  return {
    alle: customers.length,
    neu: customers.filter((c) => c.status === "neu").length,
    aktiv: customers.filter((c) => c.status === "aktiv").length,
    interessent: customers.filter((c) => c.status === "interessent").length,
    bestandskunde: customers.filter((c) => c.status === "bestandskunde").length,
  };
}

export function filterCustomers(
  customers: Customer[],
  filter: CustomerFilter
): Customer[] {
  if (filter === "alle") return customers;
  return customers.filter((c) => c.status === filter);
}

export function searchCustomers(
  customers: Customer[],
  query: string
): Customer[] {
  const q = query.trim().toLowerCase();
  if (!q) return customers;
  return customers.filter(
    (c) =>
      c.company.toLowerCase().includes(q) ||
      c.contactPerson.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q)) ||
      c.email.toLowerCase().includes(q)
  );
}

export function formatTimelineDate(date: string, time?: string): string {
  const d = new Date(date + "T12:00:00");
  const day = d.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return time ? `${day} · ${time}` : day;
}

export function sortTimeline(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) => {
    const dateA = a.time ? `${a.date}T${a.time}` : `${a.date}T12:00`;
    const dateB = b.time ? `${b.date}T${b.time}` : `${b.date}T12:00`;
    return dateB.localeCompare(dateA);
  });
}
