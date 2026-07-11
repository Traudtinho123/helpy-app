/** Nur HELPY-spezifisches Wissen — Stammdaten kommen aus CompanyProfile (Option A). */

export type WeekdayId =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export const WEEKDAY_ORDER: readonly WeekdayId[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const WEEKDAY_LABELS: Record<WeekdayId, string> = {
  monday: "Montag",
  tuesday: "Dienstag",
  wednesday: "Mittwoch",
  thursday: "Donnerstag",
  friday: "Freitag",
  saturday: "Samstag",
  sunday: "Sonntag",
};

export type BusinessDayHours = {
  closed: boolean;
  start: string;
  end: string;
};

export type CompanyKnowledgeService = {
  id: string;
  name: string;
  description: string;
  priceLabel: string;
};

export type CompanyKnowledgeFaqEntry = {
  id: string;
  question: string;
  answer: string;
};

export type ReplyStyleId =
  | "friendly-professional"
  | "short-direct"
  | "detailed-advisory"
  | "custom";

export const REPLY_STYLE_LABELS: Record<ReplyStyleId, string> = {
  "friendly-professional": "Freundlich und professionell",
  "short-direct": "Kurz und direkt",
  "detailed-advisory": "Ausführlich und beratend",
  custom: "Individuell",
};

/** Gespeichertes Unternehmenswissen (ohne Duplikate zu CompanyProfile). */
export type CompanyKnowledge = {
  companyId: string;
  companyDescription: string;
  services: CompanyKnowledgeService[];
  locations: string[];
  businessHours: Record<WeekdayId, BusinessDayHours>;
  replyStyle: ReplyStyleId;
  replyStyleCustom: string;
  /** Leer = Firmenprofil-Signatur (`companySignature`) wird genutzt. */
  emailSignatureOverride: string;
  appointmentDurationViewingMinutes: number;
  appointmentDurationConsultationMinutes: number;
  appointmentDurationOnSiteMinutes: number;
  defaultBufferMinutes: number;
  internalRules: string[];
  faq: CompanyKnowledgeFaqEntry[];
  updatedAt: string;
  updatedBy: string;
};

/** Für HELPY-Kontext: gespeichertes Wissen + Stammdaten aus CompanyProfile. */
export type ResolvedCompanyKnowledge = CompanyKnowledge & {
  companyName: string;
  industry: string;
  phone: string;
  generalEmail: string;
  website: string;
  preferredLanguage: string;
  address: string;
  emailSignature: string;
};
