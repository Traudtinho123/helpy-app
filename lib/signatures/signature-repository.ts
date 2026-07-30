import type {
  DocumentSignatureRecord,
  DocumentSigner,
  SendForSignatureInput,
  SignatureProvider,
  SignatureStatus,
} from "@/features/signatures/types/signature-types";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const devRecords = new Map<string, DocumentSignatureRecord>();

function rowToRecord(row: Record<string, unknown>): DocumentSignatureRecord {
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    helpy_document_id: String(row.helpy_document_id),
    title: typeof row.title === "string" ? row.title : null,
    vorgang_id: typeof row.vorgang_id === "string" ? row.vorgang_id : null,
    kunde_id: typeof row.kunde_id === "string" ? row.kunde_id : null,
    objekt_id: typeof row.objekt_id === "string" ? row.objekt_id : null,
    deal_id: typeof row.deal_id === "string" ? row.deal_id : null,
    signature_status: row.signature_status as SignatureStatus,
    signature_request_id:
      typeof row.signature_request_id === "string"
        ? row.signature_request_id
        : null,
    signature_envelope_id:
      typeof row.signature_envelope_id === "string"
        ? row.signature_envelope_id
        : null,
    signature_sent_at:
      typeof row.signature_sent_at === "string" ? row.signature_sent_at : null,
    signature_completed_at:
      typeof row.signature_completed_at === "string"
        ? row.signature_completed_at
        : null,
    signed_document_url:
      typeof row.signed_document_url === "string"
        ? row.signed_document_url
        : null,
    signers: Array.isArray(row.signers)
      ? (row.signers as DocumentSigner[])
      : [],
    signature_message:
      typeof row.signature_message === "string" ? row.signature_message : null,
    signature_provider:
      row.signature_provider === "email_fallback" ? "email_fallback" : "docusign",
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

function devKey(companyId: string, documentId: string): string {
  return `${companyId}:${documentId}`;
}

export async function findSignatureByDocumentId(
  companyId: string,
  helpyDocumentId: string
): Promise<DocumentSignatureRecord | null> {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    return devRecords.get(devKey(companyId, helpyDocumentId)) ?? null;
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("dokumente")
    .select("*")
    .eq("company_id", companyId)
    .eq("helpy_document_id", helpyDocumentId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToRecord(data as Record<string, unknown>);
}

export async function findSignatureByEnvelopeId(
  envelopeId: string
): Promise<DocumentSignatureRecord | null> {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    for (const record of devRecords.values()) {
      if (record.signature_envelope_id === envelopeId) return record;
    }
    return null;
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("dokumente")
    .select("*")
    .eq("signature_envelope_id", envelopeId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToRecord(data as Record<string, unknown>);
}

export async function listSignaturesForCompany(
  companyId: string
): Promise<DocumentSignatureRecord[]> {
  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    return [...devRecords.values()].filter(
      (record) => record.company_id === companyId
    );
  }

  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("dokumente")
    .select("*")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => rowToRecord(row as Record<string, unknown>));
}

export async function upsertSignatureRecord(
  companyId: string,
  input: SendForSignatureInput & {
    envelopeId: string;
    provider: "docusign" | "email_fallback" | "mock";
    status: SignatureStatus;
  }
): Promise<DocumentSignatureRecord | null> {
  const now = new Date().toISOString();
  const provider: SignatureProvider =
    input.provider === "email_fallback" ? "email_fallback" : "docusign";

  const payload = {
    company_id: companyId,
    helpy_document_id: input.documentId,
    title: input.documentTitle,
    vorgang_id: input.vorgangId ?? null,
    kunde_id: input.kundeId ?? null,
    objekt_id: input.objektId ?? null,
    deal_id: input.dealId ?? null,
    signature_status: input.status,
    signature_request_id: input.envelopeId,
    signature_envelope_id: input.envelopeId,
    signature_sent_at: now,
    signature_completed_at: null,
    signed_document_url: null,
    signers: input.signers,
    signature_message: input.message ?? null,
    signature_provider: provider,
    updated_at: now,
  };

  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    const existing = devRecords.get(devKey(companyId, input.documentId));
    const record: DocumentSignatureRecord = {
      id: existing?.id ?? `dev-sig-${Date.now()}`,
      created_at: existing?.created_at ?? now,
      ...payload,
    };
    devRecords.set(devKey(companyId, input.documentId), record);
    return record;
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const existing = await findSignatureByDocumentId(companyId, input.documentId);

  if (existing) {
    const { data, error } = await admin
      .from("dokumente")
      .update(payload as never)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error || !data) return null;
    return rowToRecord(data as Record<string, unknown>);
  }

  const { data, error } = await admin
    .from("dokumente")
    .insert(payload as never)
    .select("*")
    .single();

  if (error || !data) return null;
  return rowToRecord(data as Record<string, unknown>);
}

export async function updateSignatureStatus(
  recordId: string,
  updates: Partial<
    Pick<
      DocumentSignatureRecord,
      | "signature_status"
      | "signature_completed_at"
      | "signed_document_url"
      | "signers"
    >
  >
): Promise<DocumentSignatureRecord | null> {
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    for (const [key, record] of devRecords.entries()) {
      if (record.id === recordId) {
        const updated = { ...record, ...payload };
        devRecords.set(key, updated);
        return updated;
      }
    }
    return null;
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("dokumente")
    .update(payload as never)
    .eq("id", recordId)
    .select("*")
    .single();

  if (error || !data) return null;
  return rowToRecord(data as Record<string, unknown>);
}

export async function uploadSignedPdf(
  companyId: string,
  envelopeId: string,
  pdfBuffer: Buffer,
  fileName: string
): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) {
    return `dev://signed/${companyId}/${envelopeId}/${fileName}`;
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const path = `${companyId}/${envelopeId}/${fileName}`;
  const { error } = await admin.storage
    .from("signed-documents")
    .upload(path, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    console.error("[signatures/upload]", error.message);
    return null;
  }

  const { data } = admin.storage.from("signed-documents").getPublicUrl(path);
  return data.publicUrl || path;
}
