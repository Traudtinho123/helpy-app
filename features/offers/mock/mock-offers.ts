export type OfferStatus =
  | "entwurf"
  | "warten-auf-freigabe"
  | "gesendet"
  | "angenommen"
  | "abgelehnt";

export type QuoteLineItem = {
  id: string;
  quantity: number;
  description: string;
  unitPrice: number;
};

export type OfferCustomer = {
  company: string;
  contact: string;
  email: string;
  address: string;
};

export type HelpyOfferInsight = {
  detectedItems: string[];
  missingInfo: string[];
  recommendations: string[];
};

export type OfferDocumentFields = {
  intro?: string;
  closing?: string;
  paymentTerms?: string;
  validUntil?: string;
};

export type Offer = {
  id: string;
  number: string;
  title: string;
  status: OfferStatus;
  customer: OfferCustomer;
  lineItems: QuoteLineItem[];
  vatRate: number;
  createdAt: string;
  deadline: string;
  sourceEmail?: string;
  document?: OfferDocumentFields;
  helpy: HelpyOfferInsight;
};

export const offerStatusLabels: Record<OfferStatus, string> = {
  entwurf: "Entwurf",
  "warten-auf-freigabe": "Warten auf Freigabe",
  gesendet: "Gesendet",
  angenommen: "Angenommen",
  abgelehnt: "Abgelehnt",
};

export const offerStatusStyles: Record<OfferStatus, string> = {
  entwurf: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
  "warten-auf-freigabe": "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  gesendet: "border-[#C4B5FD] bg-[#F5F3FF] text-[#7C3AED]",
  angenommen: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
  abgelehnt: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
};

export const mockOffers: Offer[] = [
  {
    id: "1",
    number: "A-2026-0147",
    title: "Büroausstattung — 45 Arbeitsplätze",
    status: "entwurf",
    customer: {
      company: "Weber & Co. GmbH",
      contact: "Thomas Müller",
      email: "t.mueller@weber-co.de",
      address: "Industriestraße 12, 80331 München",
    },
    lineItems: [
      {
        id: "l1",
        quantity: 45,
        description: "Höhenverstellbarer Schreibtisch Premium (160×80 cm)",
        unitPrice: 890,
      },
      {
        id: "l2",
        quantity: 45,
        description: "Ergonomischer Bürostuhl Pro mit Lordosenstütze",
        unitPrice: 620,
      },
      {
        id: "l3",
        quantity: 45,
        description: "Akustik-Trennwand (120×160 cm, grau)",
        unitPrice: 285,
      },
      {
        id: "l4",
        quantity: 1,
        description: "Lieferung, Montage und Entsorgung Alt-Möbel",
        unitPrice: 4800,
      },
    ],
    vatRate: 19,
    createdAt: "06.07.2026",
    deadline: "Freitag, 10.07.2026",
    sourceEmail: "Angebotsanfrage: Büroausstattung für 45 Arbeitsplätze",
    helpy: {
      detectedItems: [
        "45× Schreibtische (höhenverstellbar)",
        "45× Bürostühle (ergonomisch)",
        "45× Akustik-Trennwände",
        "Lieferung und Montage",
      ],
      missingInfo: [
        "Gewünschte Farbvariante der Trennwände",
        "Stockwerk und Zugang für Montage",
        "Genaue Raumaufteilung (Grundriss)",
      ],
      recommendations: [
        "Ich würde die Lieferkosten separat ausweisen — das wirkt transparenter.",
        "Füge eine Garantie von 24 Monaten hinzu — der Kunde fragt danach oft.",
        "Sende das Angebot bis Freitag, der Kunde erwartet Verbindlichkeit.",
      ],
    },
  },
  {
    id: "2",
    number: "A-2026-0138",
    title: "Pilotprojekt KI-Büroprozesse",
    status: "warten-auf-freigabe",
    customer: {
      company: "TechStart AG",
      contact: "Julia Hoffmann",
      email: "j.hoffmann@techstart.de",
      address: "Leopoldstraße 88, 80802 München",
    },
    lineItems: [
      {
        id: "l1",
        quantity: 1,
        description: "HELPY Office KI — Pilotphase (3 Monate)",
        unitPrice: 8900,
      },
      {
        id: "l2",
        quantity: 8,
        description: "Onboarding & Schulung pro Arbeitsplatz",
        unitPrice: 450,
      },
    ],
    vatRate: 19,
    createdAt: "03.07.2026",
    deadline: "Diese Woche",
    sourceEmail: "Kooperationsanfrage: Gemeinsames Pilotprojekt KI",
    helpy: {
      detectedItems: ["Pilotprojekt KI-Büroprozesse", "8 Arbeitsplätze"],
      missingInfo: ["NDA-Unterschrift", "Technischer Ansprechpartner"],
      recommendations: ["Freigabe durch Geschäftsführung einholen."],
    },
  },
  {
    id: "3",
    number: "A-2024-0112",
    title: "Sanitärinstallation Neubau Wohnanlage",
    status: "gesendet",
    customer: {
      company: "Berger Bau GmbH",
      contact: "Klaus Berger",
      email: "k.berger@berger-bau.de",
      address: "Bauweg 4, 80999 München",
    },
    lineItems: [
      {
        id: "l1",
        quantity: 24,
        description: "Komplett-Badezimmer Installation (Standard)",
        unitPrice: 3200,
      },
      {
        id: "l2",
        quantity: 1,
        description: "Projektleitung und Koordination",
        unitPrice: 6500,
      },
    ],
    vatRate: 19,
    createdAt: "28.06.2026",
    deadline: "—",
    helpy: {
      detectedItems: ["24 Badeinheiten", "Projektleitung"],
      missingInfo: [],
      recommendations: ["Nachfassen in 5 Werktagen, wenn keine Rückmeldung."],
    },
  },
  {
    id: "4",
    number: "A-2026-0095",
    title: "Wartungsvertrag Heizungsanlage",
    status: "angenommen",
    customer: {
      company: "Schmidt GmbH",
      contact: "Sandra Klein",
      email: "s.klein@schmidt-gmbh.de",
      address: "Maximilianstraße 15, 80539 München",
    },
    lineItems: [
      {
        id: "l1",
        quantity: 1,
        description: "Jährlicher Wartungsvertrag (12 Monate)",
        unitPrice: 2400,
      },
    ],
    vatRate: 19,
    createdAt: "15.06.2026",
    deadline: "—",
    helpy: {
      detectedItems: ["Wartungsvertrag Heizung"],
      missingInfo: [],
      recommendations: ["Termin für Vertragsstart im Kalender eintragen."],
    },
  },
  {
    id: "5",
    number: "A-2026-0081",
    title: "Fassadensanierung Bürogebäude",
    status: "abgelehnt",
    customer: {
      company: "ImmoService Richter",
      contact: "Anna Richter",
      email: "a.richter@immoservice.de",
      address: "Sendlinger Straße 42, 81371 München",
    },
    lineItems: [
      {
        id: "l1",
        quantity: 850,
        description: "Fassadenanstrich inkl. Gerüst (m²)",
        unitPrice: 42,
      },
    ],
    vatRate: 19,
    createdAt: "01.06.2026",
    deadline: "—",
    helpy: {
      detectedItems: ["850 m² Fassadenanstrich"],
      missingInfo: [],
      recommendations: [
        "Kunde wählte günstigeren Anbieter — Follow-up in 6 Monaten.",
      ],
    },
  },
];

export function calculateQuoteTotals(lineItems: QuoteLineItem[], vatRate: number) {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const vat = subtotal * (vatRate / 100);
  const total = subtotal + vat;

  return { subtotal, vat, total };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function filterOffersByStatus(
  offers: Offer[],
  status: OfferStatus | "alle"
): Offer[] {
  if (status === "alle") return offers;
  return offers.filter((o) => o.status === status);
}

export function getOfferStatusCounts(
  offers: Offer[]
): Record<OfferStatus | "alle", number> {
  const statuses: (OfferStatus | "alle")[] = [
    "alle",
    "entwurf",
    "warten-auf-freigabe",
    "gesendet",
    "angenommen",
    "abgelehnt",
  ];

  return Object.fromEntries(
    statuses.map((s) => [
      s,
      s === "alle" ? offers.length : offers.filter((o) => o.status === s).length,
    ])
  ) as Record<OfferStatus | "alle", number>;
}
