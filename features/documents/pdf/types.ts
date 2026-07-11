import type { DocumentTypeId } from "@/features/documents/services/types";

/** Shared party block for customer / recipient on professional documents. */
export type DocumentParty = {
  company?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
};

export type DocumentLineItem = {
  id: string;
  position?: number;
  quantity: number;
  unit?: string;
  description: string;
  unitPrice: number;
  /** Optional detailed scope text (Offerte). */
  detail?: string;
};

export type AngebotPayload = {
  kind: "angebot";
  documentNumber: string;
  title: string;
  issuedAt: string;
  validUntil: string;
  customer: DocumentParty;
  intro: string;
  lineItems: DocumentLineItem[];
  vatRate: number;
  paymentTerms: string;
  closing: string;
  signatureLabel?: string;
};

export type OffertePayload = {
  kind: "offerte";
  /** Prominent Swiss-style reference number */
  referenceNumber: string;
  title: string;
  issuedAt: string;
  validUntil: string;
  customer: DocumentParty;
  projectDescription: string;
  lineItems: DocumentLineItem[];
  vatRate: number;
  paymentTerms: string;
  legalNotice: string;
  closing: string;
};

export type ExposeHighlight = {
  label: string;
  value: string;
};

export type ExposePayload = {
  kind: "expose";
  title: string;
  subtitle?: string;
  address: string;
  cityLine: string;
  priceLabel: string;
  transactionLabel?: string;
  description: string;
  locationText: string;
  highlights: ExposeHighlight[];
  imageUrls: string[];
  contact: DocumentParty;
};

export type BesichtigungsterminPayload = {
  kind: "besichtigungstermin";
  title: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel?: string;
  objectTitle: string;
  address: string;
  directionsHint?: string;
  visitor: DocumentParty;
  contact: DocumentParty;
  checklist: string[];
  notes?: string;
};

export type DossierPayload = {
  kind: "dossier";
  title: string;
  subtitle: string;
  objectType: string;
  address: string;
  cityLine: string;
  priceLabel: string;
  transactionLabel?: string;
  eckdaten: ExposeHighlight[];
  description: string;
  highlights: string[];
  nextStepActions: string[];
  contact: DocumentParty;
  imageUrls: string[];
};

export type ProfessionalDocumentPayload =
  | AngebotPayload
  | OffertePayload
  | ExposePayload
  | BesichtigungsterminPayload
  | DossierPayload;

export type PdfDocumentKind = ProfessionalDocumentPayload["kind"];

export const PDF_DOCUMENT_KINDS: PdfDocumentKind[] = [
  "angebot",
  "offerte",
  "expose",
  "besichtigungstermin",
  "dossier",
];

export function isPdfDocumentKind(
  value: string
): value is PdfDocumentKind {
  return (PDF_DOCUMENT_KINDS as string[]).includes(value);
}

export function documentTypeSupportsPdf(
  typeId: DocumentTypeId
): typeId is Extract<PdfDocumentKind, DocumentTypeId> {
  return isPdfDocumentKind(typeId);
}
