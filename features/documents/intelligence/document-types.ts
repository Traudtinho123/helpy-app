import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { RecognizedDocumentSource } from "@/features/documents/intelligence/document-source";
import type { MailMessageDirection, UnifiedMailAttachment } from "@/features/mail/types/unified-mail-types";

export type RecognizedDocumentStatus = "Von HELPY erkannt";

export type RealEstateDocumentCategory =
  | "expose"
  | "grundriss"
  | "objektbild"
  | "finanzierungsbestaetigung"
  | "ausweis"
  | "vertrag"
  | "mietunterlagen"
  | "sonstiges";

export type ConstructionDocumentCategory =
  | "plan"
  | "foto"
  | "offerte"
  | "rechnung"
  | "materialliste"
  | "vertrag"
  | "sonstiges";

export type ConsultingDocumentCategory =
  | "vertrag"
  | "vollmacht"
  | "ausweis"
  | "rechnung"
  | "dokument-zur-pruefung"
  | "sonstiges";

export type RecognizedDocumentCategory =
  | RealEstateDocumentCategory
  | ConstructionDocumentCategory
  | ConsultingDocumentCategory;

export type HelpyRecognizedDocument = {
  id: string;
  preparedDocumentId: string;
  fileName: string;
  mimeType: string;
  messageId?: string;
  providerAttachmentId?: string;
  direction?: MailMessageDirection;
  messageReceivedAt?: string;
  messageSubject?: string;
  sizeBytes?: number;
  sizeLabel?: string;
  source: RecognizedDocumentSource;
  category: RecognizedDocumentCategory;
  categoryLabel: string;
  relatedCustomerId: string | null;
  relatedObjectId: string | null;
  relatedVorgangId: string;
  status: RecognizedDocumentStatus;
  assignedToLabel: string;
  recommendation: string;
  openHref: string;
};

export type GmailAttachmentCandidate = {
  fileName: string;
  mimeType: string;
  messageId?: string;
  providerAttachmentId?: string;
  direction?: MailMessageDirection;
  messageReceivedAt?: string;
  messageSubject?: string;
  sizeBytes?: number;
  sizeLabel?: string;
};

export type RecognizeDocumentsInput = {
  vorgangId: string;
  vorgangTitle?: string;
  skill: HelpySkill;
  subject: string;
  snippet: string;
  intentLabel?: string;
  messageId?: string;
  sourceThreadId?: string;
  sourceQuelle?: string;
  customerEmail?: string;
  customerName?: string;
  customerId?: string | null;
  objectId?: string | null;
  objectTitle?: string | null;
  /** Echte Gmail-Anhänge — haben Vorrang vor Text-Heuristik */
  mailAttachments?: readonly UnifiedMailAttachment[];
};

export const REAL_ESTATE_CATEGORY_LABELS: Record<RealEstateDocumentCategory, string> =
  {
    expose: "Exposé",
    grundriss: "Grundriss",
    objektbild: "Objektbild",
    finanzierungsbestaetigung: "Finanzierungsbestätigung",
    ausweis: "Ausweis",
    mietunterlagen: "Mietunterlagen",
    vertrag: "Vertrag",
    sonstiges: "Sonstiges",
  };

export const CONSTRUCTION_CATEGORY_LABELS: Record<
  ConstructionDocumentCategory,
  string
> = {
  plan: "Plan",
  foto: "Foto",
  offerte: "Offerte",
  rechnung: "Rechnung",
  materialliste: "Materialliste",
  vertrag: "Vertrag",
  sonstiges: "Sonstiges",
};

export const CONSULTING_CATEGORY_LABELS: Record<
  ConsultingDocumentCategory,
  string
> = {
  vertrag: "Vertrag",
  vollmacht: "Vollmacht",
  ausweis: "Ausweis",
  rechnung: "Rechnung",
  "dokument-zur-pruefung": "Dokument zur Prüfung",
  sonstiges: "Sonstiges",
};

export function getCategoryLabel(
  skill: HelpySkill,
  category: RecognizedDocumentCategory
): string {
  if (skill === "real-estate") {
    return REAL_ESTATE_CATEGORY_LABELS[category as RealEstateDocumentCategory];
  }
  if (skill === "construction") {
    return CONSTRUCTION_CATEGORY_LABELS[category as ConstructionDocumentCategory];
  }
  return CONSULTING_CATEGORY_LABELS[category as ConsultingDocumentCategory];
}
