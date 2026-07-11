export type {
  ConstructionDocumentCategory,
  ConsultingDocumentCategory,
  GmailAttachmentCandidate,
  HelpyRecognizedDocument,
  RealEstateDocumentCategory,
  RecognizedDocumentCategory,
  RecognizedDocumentStatus,
  RecognizeDocumentsInput,
} from "@/features/documents/intelligence/document-types";

export type { RecognizedDocumentSource } from "@/features/documents/intelligence/document-source";

export {
  CONSTRUCTION_CATEGORY_LABELS,
  CONSULTING_CATEGORY_LABELS,
  REAL_ESTATE_CATEGORY_LABELS,
  getCategoryLabel,
} from "@/features/documents/intelligence/document-types";

export {
  buildAttachmentDedupeKey,
  normalizeFileName,
  parseSizeFromText,
} from "@/features/documents/intelligence/document-dedupe";

export { resolveDocumentSource } from "@/features/documents/intelligence/document-source";

export {
  buildRecommendation,
  classifyAttachment,
  extractAttachmentCandidates,
  hasGmailAttachmentSignals,
  inferMimeTypeFromFileName,
} from "@/features/documents/intelligence/document-classifier";

export {
  EMPTY_RECOGNIZED_DOCUMENTS,
  buildRecognizeDocumentsInputFromWorkspace,
  getRecognizedDocumentsSnapshot,
  invalidateRecognizedDocumentsCache,
  recognizeDocumentsFromGmailContext,
  seedRecognizedDocumentsFromBundles,
  syncRecognizedDocumentsFromContext,
} from "@/features/documents/intelligence/document-recognition-service";
