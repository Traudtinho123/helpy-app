export type SignatureStatus =
  | "entwurf"
  | "gesendet"
  | "teilweise"
  | "vollstaendig"
  | "abgelaufen"
  | "abgebrochen";

export type SignatureProvider = "docusign" | "email_fallback";

export type DocumentSigner = {
  name: string;
  email: string;
  role?: string;
  status?: "pending" | "sent" | "delivered" | "signed" | "declined";
  signedAt?: string | null;
};

export type DocumentSignatureRecord = {
  id: string;
  company_id: string;
  helpy_document_id: string;
  title: string | null;
  vorgang_id: string | null;
  kunde_id: string | null;
  objekt_id: string | null;
  deal_id: string | null;
  signature_status: SignatureStatus;
  signature_request_id: string | null;
  signature_envelope_id: string | null;
  signature_sent_at: string | null;
  signature_completed_at: string | null;
  signed_document_url: string | null;
  signers: DocumentSigner[];
  signature_message: string | null;
  signature_provider: SignatureProvider;
  created_at: string;
  updated_at: string;
};

export const SIGNATURE_STATUS_LABELS: Record<SignatureStatus, string> = {
  entwurf: "Entwurf",
  gesendet: "Warte auf Unterschrift",
  teilweise: "Teilweise unterschrieben",
  vollstaendig: "Vollständig unterschrieben ✓",
  abgelaufen: "Abgelaufen",
  abgebrochen: "Abgebrochen",
};

export const SIGNATURE_STATUS_STYLES: Record<SignatureStatus, string> = {
  entwurf: "border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]",
  gesendet: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  teilweise: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
  vollstaendig: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
  abgelaufen: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
  abgebrochen: "border-[#CBD5E1] bg-[#F1F5F9] text-[#475569]",
};

export type SendForSignatureInput = {
  documentId: string;
  documentTitle: string;
  fileName: string;
  pdfBase64: string;
  signers: DocumentSigner[];
  message?: string;
  vorgangId?: string | null;
  kundeId?: string | null;
  objektId?: string | null;
  dealId?: string | null;
};
