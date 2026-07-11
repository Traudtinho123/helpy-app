export {
  getAllDocuments,
  getDocumentById,
  findDocumentByDedupeKey,
  getDocumentCounts,
  getDocumentPreviewTitle,
  getDocumentsForCustomer,
  getDocumentsForObject,
  getDocumentsForTab,
  getHelpyPreparedCount,
  getDocumentsForVorgang,
  getPreparedDocumentForVorgang,
  searchDocuments,
  subscribeDocuments,
  upsertPreparedDocument,
} from "@/features/documents/services/document-engine";

export {
  applyDocumentLinks,
  buildDocumentLinks,
} from "@/features/documents/services/document-link-engine";

export {
  DOCUMENT_TYPE_LABELS,
  getAllTemplates,
  getDocumentTypeLabel,
  getDocumentTypesForSkill,
  getTemplateById,
  getTemplatesForSkill,
  isTypeForSkill,
  registerTemplates,
  SKILL_DOCUMENT_TYPES,
} from "@/features/documents/services/template-registry";

export { MOCK_DOCUMENTS } from "@/features/documents/services/mock-documents";
export { MOCK_TEMPLATES } from "@/features/documents/services/mock-templates";

export {
  getDocumentBranding,
  getCompanyProfile,
} from "@/features/documents/services/document-branding";

export {
  getOverviewDocuments,
  getOverviewFilterCounts,
  hasRealOverviewDocuments,
} from "@/features/documents/services/documents-overview-engine";

export {
  DOCUMENT_OVERVIEW_FILTER_LABELS,
  DOCUMENT_OVERVIEW_FILTER_ORDER,
  getDocumentAssignedToLabel,
  getDocumentCategoryLabel,
  getDocumentFileName,
  getDocumentObjectOrVorgangLabel,
  getDocumentOverviewCategory,
  getDocumentSourceLabel,
  isRealOverviewDocument,
  matchesOverviewFilter,
  sortOverviewDocuments,
} from "@/features/documents/services/document-overview-utils";

export {
  DOCUMENT_ENGINE_HELPY_MESSAGES,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_STYLES,
  getDocumentDisplayStatus,
} from "@/features/documents/services/types";

export type {
  ConsultingLegalDocumentType,
  DocumentCategory,
  DocumentCounts,
  DocumentEngineContext,
  DocumentFilterTab,
  DocumentPreviewSection,
  DocumentStatus,
  DocumentTemplate,
  DocumentTypeId,
  ConstructionDocumentType,
  PreparedDocument,
  PreparedDocumentLinks,
  RealEstateDocumentType,
} from "@/features/documents/services/types";

export {
  buildAngebotPayloadFromOffer,
  buildOffertePayloadFromOffer,
  buildPayloadFromPreparedDocument,
  canGeneratePdfForDocument,
  documentTypeSupportsPdf,
} from "@/features/documents/pdf";

export type { ProfessionalDocumentPayload } from "@/features/documents/pdf";

export type { DocumentOverviewFilter } from "@/features/documents/services/document-overview-utils";
export type { DocumentOverviewCounts } from "@/features/documents/services/documents-overview-engine";
