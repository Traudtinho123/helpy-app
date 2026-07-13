import type { AppointmentSuggestion } from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import type { HelpyRecognizedDocument } from "@/features/documents/intelligence/document-types";
import type { PreparedDocument } from "@/features/documents/services/types";
import type { ReplyDraft } from "@/features/reply-drafts/types/reply-draft-types";
import type { ResolvedGmailWorkflowStep } from "@/features/workspace/services/gmail-workspace/gmail-workflow-steps";
import type { UnifiedMailAttachment } from "@/features/mail/types/unified-mail-types";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

export type WorkspaceCustomerContext = {
  id: string | null;
  name: string;
  firma: string;
  email: string;
  telefon: string;
  adresse: string;
  quelle: string;
  skillLabel: string;
  status: string;
  statusLabel: string;
  helpyHint: string;
  betreff: string;
  isKnownCustomer: boolean;
  source: "kundenakte" | "crm" | "vorgang";
};

export type WorkspacePlatformObjectContext = {
  objekt: string | null;
  adresse: string | null;
  link: string | null;
  besichtigung: string | null;
  nachricht: string | null;
};

export type WorkspaceObjectContext = {
  objectId: string | null;
  titel: string;
  adresse: string;
  quelle: string;
  preis: string | null;
  status: string;
  source: "object-memory" | "platform";
  platform: WorkspacePlatformObjectContext | null;
};

export type WorkspaceMailContext = {
  betreff: string;
  absender: string;
  datum: string;
  inhalt: string;
  zusammenfassung: string;
  snippet: string;
  quelle: string;
  intentLabel: string | null;
  summary: string | null;
  detectedContext: readonly string[];
  replyDraft: ReplyDraft | null;
};

export type WorkspaceAppointmentContext = {
  suggestion: AppointmentSuggestion | null;
  terminwunsch: string | null;
  fallbackTermin: {
    titel: string;
    datum: string;
    ort?: string;
  } | null;
  showSuggestions: boolean;
  showViewingConfirmed: boolean;
  showTerminstatus: boolean;
};

export type WorkspaceRecommendationContext = {
  decisionTitle: string;
  nextBestStep: string;
  reason: string;
  preparedItems: readonly string[];
  helpyMessage: string;
};

export type WorkspaceWorkflowContext = {
  steps: readonly ResolvedGmailWorkflowStep[];
  isArchive: boolean;
  archiveStatusLabel: string | null;
  archiveRecommendation: string | null;
  nextBestStep: string;
  preparedItems: readonly string[];
};

export type WorkspaceContext = {
  workspaceId: string;
  vorgang: Vorgang;
  listeVorgang: ListeVorgang | null;
  customer: WorkspaceCustomerContext | null;
  object: WorkspaceObjectContext | null;
  mail: WorkspaceMailContext;
  appointment: WorkspaceAppointmentContext;
  documents: readonly PreparedDocument[];
  recognizedDocuments: readonly HelpyRecognizedDocument[];
  /** Gmail-Anhang-Metadaten (Bytes via API-Proxy) */
  mailAttachments: readonly UnifiedMailAttachment[];
  recommendation: WorkspaceRecommendationContext | null;
  currentWorkflow: WorkspaceWorkflowContext;
};

export const EMPTY_WORKSPACE_CONTEXT_DOCUMENTS: readonly PreparedDocument[] = [];
export const EMPTY_WORKSPACE_RECOGNIZED_DOCUMENTS: readonly HelpyRecognizedDocument[] = [];
export const EMPTY_WORKSPACE_MAIL_ATTACHMENTS: readonly UnifiedMailAttachment[] = [];

export const EMPTY_WORKSPACE_PLATFORM_OBJECT: WorkspacePlatformObjectContext = {
  objekt: null,
  adresse: null,
  link: null,
  besichtigung: null,
  nachricht: null,
};

export const EMPTY_WORKSPACE_APPOINTMENT: WorkspaceAppointmentContext = {
  suggestion: null,
  terminwunsch: null,
  fallbackTermin: null,
  showSuggestions: false,
  showViewingConfirmed: false,
  showTerminstatus: false,
};

export const EMPTY_WORKSPACE_WORKFLOW: WorkspaceWorkflowContext = {
  steps: [],
  isArchive: false,
  archiveStatusLabel: null,
  archiveRecommendation: null,
  nextBestStep: "",
  preparedItems: [],
};

export const EMPTY_WORKSPACE_MAIL: WorkspaceMailContext = {
  betreff: "",
  absender: "",
  datum: "",
  inhalt: "",
  zusammenfassung: "",
  snippet: "",
  quelle: "Gmail",
  intentLabel: null,
  summary: null,
  detectedContext: [],
  replyDraft: null,
};

/** Stabile SSR-/Fallback-Referenz — nie pro Aufruf neu erzeugen. */
export const EMPTY_WORKSPACE_CONTEXT: WorkspaceContext = {
  workspaceId: "",
  vorgang: {
    id: "",
    skill: "real-estate",
    kunde: {
      firmenname: "",
      ansprechpartner: "",
      email: "",
      telefon: "",
      adresse: "",
      status: "",
    },
    aufgabe: {
      titel: "",
      kategorie: "",
      fortschritt: 0,
      empfohleneAktion: "",
    },
    letzteEmail: {
      betreff: "",
      absender: "",
      datum: "",
      inhalt: "",
      zusammenfassung: "",
    },
    termine: [],
    dokumente: [],
    notizen: "",
    helpy: {
      empfehlung: "",
      naechsterSchritt: "",
    },
  },
  listeVorgang: null,
  customer: null,
  object: null,
  mail: EMPTY_WORKSPACE_MAIL,
  appointment: EMPTY_WORKSPACE_APPOINTMENT,
  documents: EMPTY_WORKSPACE_CONTEXT_DOCUMENTS,
  recognizedDocuments: EMPTY_WORKSPACE_RECOGNIZED_DOCUMENTS,
  mailAttachments: EMPTY_WORKSPACE_MAIL_ATTACHMENTS,
  recommendation: null,
  currentWorkflow: EMPTY_WORKSPACE_WORKFLOW,
};
