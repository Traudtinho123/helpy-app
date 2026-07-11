import type { CrmPipelineStage } from "@/features/crm/pipeline/pipeline-types";
import type { ProfessionalDocumentPayload } from "@/features/documents/pdf/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export type DocumentCategory =
  | "vorlage"
  | "entwurf"
  | "fertig"
  | "helpy-vorbereitet";

export type DocumentStatus =
  | "entwurf"
  | "zur-pruefung"
  | "freigegeben"
  | "gesendet"
  | "archiviert";

export type RealEstateDocumentType =
  | "expose"
  | "besichtigungstermin"
  | "besichtigungsprotokoll"
  | "reservationsbestaetigung"
  | "kaufinteressenten-zusammenfassung";

export type ConstructionDocumentType =
  | "offerte"
  | "arbeitsrapport"
  | "materialliste"
  | "auftragsbestaetigung";

export type ConsultingLegalDocumentType =
  | "angebot"
  | "mandatsbestaetigung"
  | "vollmacht"
  | "beratungsprotokoll"
  | "fristenuebersicht";

export type DocumentTypeId =
  | RealEstateDocumentType
  | ConstructionDocumentType
  | ConsultingLegalDocumentType;

export type DocumentTemplate = {
  id: string;
  typeId: DocumentTypeId;
  skill: HelpySkill;
  label: string;
  description: string;
  category: "vorlage";
};

export type PreparedDocumentLinks = {
  objectId?: string;
  objectTitle?: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  /** Interne Stufenlogik — nicht als „Pipeline“ in der UI anzeigen. */
  pipelineStage?: CrmPipelineStage;
  interessentVorgangIds?: string[];
  interessentNames?: string[];
  besichtigungIds?: string[];
};

export type PreparedDocumentAttachmentMeta = {
  fileName: string;
  mimeType: string;
  sourceMessageId?: string;
  providerAttachmentId?: string;
  sourceThreadId?: string;
  sizeBytes?: number;
  sizeLabel?: string;
  sourcePlatform: string;
  recognizedCategory: string;
  recognizedStatus: "Von HELPY erkannt";
  dedupeKey: string;
};

export type PreparedDocument = {
  id: string;
  typeId: DocumentTypeId;
  skill: HelpySkill;
  typeLabel: string;
  title: string;
  customer: string;
  vorgangId?: string;
  vorgangTitle?: string;
  objectId?: string;
  links?: PreparedDocumentLinks;
  attachmentMeta?: PreparedDocumentAttachmentMeta;
  status: DocumentStatus;
  category: DocumentCategory;
  lastEdited: string;
  helpyHint: string;
  preparedByHelpy: boolean;
  previewSections: DocumentPreviewSection[];
  /** Structured payload for professional PDF templates (optional). */
  pdfPayload?: ProfessionalDocumentPayload;
};

export type DocumentPreviewSection = {
  heading?: string;
  content: string;
};

export type DocumentFilterTab =
  | "alle"
  | "vorlagen"
  | "entwuerfe"
  | "fertige"
  | "helpy-vorbereitet";

export type DocumentCounts = Record<DocumentFilterTab, number>;

export type DocumentEngineContext = {
  skill?: HelpySkill;
  tab: DocumentFilterTab;
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  entwurf: "Entwurf",
  "zur-pruefung": "Zur Prüfung",
  freigegeben: "Freigegeben",
  gesendet: "Gesendet",
  archiviert: "Archiviert",
};

export const DOCUMENT_STATUS_STYLES: Record<DocumentStatus, string> = {
  entwurf: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
  "zur-pruefung": "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  freigegeben: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
  gesendet: "border-[#C4B5FD] bg-[#F5F3FF] text-[#7C3AED]",
  archiviert: "border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]",
};

export function getDocumentDisplayStatus(document: PreparedDocument): string {
  if (document.attachmentMeta?.recognizedStatus) {
    return document.attachmentMeta.recognizedStatus;
  }
  return DOCUMENT_STATUS_LABELS[document.status];
}

export const DOCUMENT_ENGINE_HELPY_MESSAGES = {
  intro: "Ich habe passende Dokumente für deine Vorgänge vorbereitet.",
  disclaimer:
    "Bitte prüfe Inhalt, Kundendaten und rechtliche Angaben vor dem Versand.",
  trust:
    "Ich bereite Dokumente vor, die du final prüfen kannst.",
} as const;
