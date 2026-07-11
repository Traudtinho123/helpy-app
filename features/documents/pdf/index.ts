export type {
  AngebotPayload,
  BesichtigungsterminPayload,
  DocumentLineItem,
  DocumentParty,
  ExposeHighlight,
  ExposePayload,
  OffertePayload,
  PdfDocumentKind,
  ProfessionalDocumentPayload,
} from "@/features/documents/pdf/types";

export {
  PDF_DOCUMENT_KINDS,
  documentTypeSupportsPdf,
  isPdfDocumentKind,
} from "@/features/documents/pdf/types";

export { toCompanyBranding } from "@/features/documents/pdf/branding";
export type { CompanyBranding } from "@/features/documents/pdf/branding";

export {
  buildAngebotPayloadFromOffer,
  buildOffertePayloadFromOffer,
  buildPayloadFromPreparedDocument,
  canGeneratePdfForDocument,
} from "@/features/documents/pdf/payload-builders";

export {
  renderProfessionalPdf,
  suggestPdfFileName,
} from "@/features/documents/pdf/render-pdf";
