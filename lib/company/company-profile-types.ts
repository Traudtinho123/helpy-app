import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export type DocumentLanguage = "de" | "en" | "fr";

export const DOCUMENT_LANGUAGE_LABELS: Record<DocumentLanguage, string> = {
  de: "Deutsch",
  en: "Englisch",
  fr: "Französisch",
};

export type WorkingHours = {
  start: string;
  end: string;
};

export type TeamSettings = {
  allowMemberConnections: boolean;
  sharedWorkspace: boolean;
};

export type CompanyProfile = {
  companyId: string;
  companyName: string;
  industry: string;
  activePaidSkill: HelpySkill;
  logoInitials: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  documentTemplates: string[];
  defaultWorkingHours: WorkingHours;
  companySignature: string;
  defaultPlatforms: string[];
  teamSettings: TeamSettings;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  iban: string;
  defaultVatRate: number;
  paymentTerms: string;
  footer: string;
  documentLanguage: DocumentLanguage;
};

export const MOCK_COMPANY_PROFILE: CompanyProfile = {
  companyId: "helpy-demo-company",
  companyName: "Traudt Immobilien GmbH",
  industry: "Immobilien",
  /**
   * Fallback nur ohne Supabase / vor DB-Hydration.
   * Produktiv kommt der Skill aus profiles.allowed_skills.
   */
  activePaidSkill: "real-estate",
  logoInitials: "TI",
  logoUrl: null,
  primaryColor: "#1E3A8A",
  secondaryColor: "#3B82F6",
  documentTemplates: ["angebot", "offerte", "rechnung"],
  defaultWorkingHours: {
    start: "08:00",
    end: "18:00",
  },
  companySignature:
    "Mit freundlichen Grüssen\nMartina Traudt\nTraudt Immobilien GmbH",
  defaultPlatforms: [
    "gmail",
    "immoscout24",
    "homegate",
    "newhome",
    "website-formulare",
    "apple-calendar",
    "google-calendar",
  ],
  teamSettings: {
    allowMemberConnections: true,
    sharedWorkspace: true,
  },
  address: "Maximilianstraße 15, 80539 München",
  phone: "+49 89 234 567 89",
  email: "info@traudt-immobilien.de",
  website: "www.traudt-immobilien.de",
  taxId: "USt-IdNr. DE298765432",
  iban: "DE89 3704 0044 0532 0130 00",
  defaultVatRate: 19,
  paymentTerms:
    "Zahlbar innerhalb von 14 Tagen nach Rechnungsstellung ohne Abzug. Bei Auftragserteilung ist eine Anzahlung von 30 % fällig, der Restbetrag nach Leistungserbringung.",
  footer:
    "Traudt Immobilien GmbH · Geschäftsführung: Martina Traudt\nAlle Angaben ohne Gewähr. Es gelten unsere AGB.",
  documentLanguage: "de",
};

export type CompanyDocumentBranding = {
  profile: CompanyProfile;
  senderLine: string;
  contactBlock: string[];
  legalBlock: string[];
};
