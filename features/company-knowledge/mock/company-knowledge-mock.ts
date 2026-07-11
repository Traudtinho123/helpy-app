import type { CompanyKnowledge } from "@/features/company-knowledge/types/company-knowledge-types";
import { createDefaultBusinessHours } from "@/features/company-knowledge/services/company-knowledge-defaults";

export const MOCK_COMPANY_KNOWLEDGE: CompanyKnowledge = {
  companyId: "helpy-demo-company",
  companyDescription:
    "Traudt Immobilien berät Käufer, Verkäufer und Mieter in München und Umgebung — persönlich, transparent und mit Fokus auf passende Objekte.",
  services: [
    {
      id: "svc-verkauf",
      name: "Verkauf Wohnimmobilien",
      description: "Bewertung, Vermarktung und Begleitung bis zum Notartermin.",
      priceLabel: "Individuelles Honorar nach Objekt",
    },
    {
      id: "svc-vermietung",
      name: "Vermietung",
      description: "Mietersuche, Bonitätsprüfung und Übergabe.",
      priceLabel: "ab 1.5 Monatsmieten",
    },
  ],
  locations: ["München", "Grünwald", "Unterhaching"],
  businessHours: {
    ...createDefaultBusinessHours(),
    saturday: { closed: true, start: "09:00", end: "12:00" },
    sunday: { closed: true, start: "09:00", end: "12:00" },
  },
  replyStyle: "friendly-professional",
  replyStyleCustom: "",
  emailSignatureOverride: "",
  appointmentDurationViewingMinutes: 45,
  appointmentDurationConsultationMinutes: 30,
  appointmentDurationOnSiteMinutes: 60,
  defaultBufferMinutes: 15,
  internalRules: [
    "Besichtigungen nur Montag bis Freitag.",
    "Offerten nie ohne Vor-Ort-Termin versenden.",
    "Bei fehlender Telefonnummer immer nachfragen.",
  ],
  faq: [
    {
      id: "faq-besichtigung",
      question: "Wie lange dauert eine Besichtigung?",
      answer: "In der Regel 45 Minuten pro Objekt.",
    },
    {
      id: "faq-unterlagen",
      question: "Welche Unterlagen braucht der Interessent?",
      answer:
        "Lichtbildausweis und bei Bedarf eine Finanzierungsbestätigung.",
    },
  ],
  updatedAt: "2026-07-10T08:00:00+02:00",
  updatedBy: "Martina Traut",
};
