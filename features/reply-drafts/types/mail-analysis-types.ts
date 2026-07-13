export type MailTon = "formell" | "informell";
export type MailSprache = "de" | "en" | "fr";
export type MailDringlichkeit = "normal" | "hoch";

/** Strukturierte Mail-Analyse (Schicht C) vor der Antwort-Generierung. */
export type MailAnalysisExtraction = {
  absender_name: string;
  sprache: MailSprache;
  ton: MailTon;
  anliegen: string;
  konkrete_fragen: string[];
  gewuenschte_aktion: string | null;
  genannte_objekte: string[];
  genannte_daten: string[];
  dringlichkeit: MailDringlichkeit;
};

export type ReplyObjectLookupResult = {
  query: string;
  objectId: string;
  titel: string;
  adresse: string;
  zimmer: string | null;
  wohnflaeche: string | null;
  preis: string | null;
  verfuegbarkeit: string | null;
  summaryLine: string;
};

export type ReplyCustomerContext = {
  isKnownCustomer: boolean;
  customerName: string | null;
  companyName: string | null;
  status: string | null;
  leadScore: number | null;
  notes: string[];
  previousMails: Array<{
    subject: string;
    snippet: string;
    dateLabel: string;
  }>;
};

export type ReplyDraftVariantId = "short" | "detailed";

export type ReplyQualityWarningType =
  | "unanswered_question"
  | "generic"
  | "missing_name";

export type ReplyQualityWarning = {
  type: ReplyQualityWarningType;
  message: string;
};

export type ReplyGenerationContext = {
  mailBody: string;
  analysis: MailAnalysisExtraction;
  objectLookups: ReplyObjectLookupResult[];
  customerContext: ReplyCustomerContext;
  appointmentSlotLines: string[];
  companyPromptBlock: string;
  companyName: string;
  replyStyleLabel: string;
};

export type GeneratedReplyVariants = {
  short: string;
  detailed: string;
};

export type ReplyGenerationResult = {
  variants: GeneratedReplyVariants;
  selectedVariant: ReplyDraftVariantId;
  draftText: string;
  tone: string;
  subject: string;
  qualityWarnings: ReplyQualityWarning[];
  analysis: MailAnalysisExtraction;
  generationSource: "gpt" | "enriched-template";
};
