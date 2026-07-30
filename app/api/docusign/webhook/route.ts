import { NextResponse } from "next/server";
import {
  downloadSignedDocuSignPdf,
  mapDocuSignEnvelopeStatus,
} from "@/lib/docusign/client";
import {
  findSignatureByEnvelopeId,
  updateSignatureStatus,
  uploadSignedPdf,
} from "@/lib/signatures/signature-repository";
import { findDealByVorgangId, updateDealPhase } from "@/lib/deals/deal-repository";

export async function completeSignatureFromWebhook(input: {
  envelopeId: string;
  status: string;
  signerName?: string;
}) {
  const record = await findSignatureByEnvelopeId(input.envelopeId);
  if (!record) return null;

  const signerCount = record.signers.length;
  const completedSigners =
    input.status.toLowerCase() === "completed" ? signerCount : 0;

  const signatureStatus = mapDocuSignEnvelopeStatus(
    input.status,
    signerCount,
    completedSigners
  );

  let signedUrl = record.signed_document_url;

  if (signatureStatus === "vollstaendig") {
    const pdf = await downloadSignedDocuSignPdf(input.envelopeId);
    if (pdf) {
      signedUrl = await uploadSignedPdf(
        record.company_id,
        input.envelopeId,
        pdf,
        `${record.helpy_document_id}-signed.pdf`
      );
    }

    if (record.vorgang_id) {
      const deal = await findDealByVorgangId(record.company_id, record.vorgang_id);
      if (deal && deal.phase < 7) {
        await updateDealPhase({
          dealId: deal.id,
          companyId: record.company_id,
          userId: null,
          phase: 7,
          typ: "auto_erkannt",
          beschreibung: "Dokument unterschrieben — Phase automatisch angepasst.",
        });
      }
    }
  }

  return updateSignatureStatus(record.id, {
    signature_status: signatureStatus,
    signature_completed_at:
      signatureStatus === "vollstaendig"
        ? new Date().toISOString()
        : record.signature_completed_at,
    signed_document_url: signedUrl,
    signers: record.signers.map((signer) => ({
      ...signer,
      status: signatureStatus === "vollstaendig" ? "signed" : signer.status,
      signedAt:
        signatureStatus === "vollstaendig"
          ? new Date().toISOString()
          : signer.signedAt,
    })),
  });
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;

  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ received: true });
  }

  const data = (payload.data ?? payload) as Record<string, unknown>;
  const envelopeId =
    typeof data.envelopeId === "string"
      ? data.envelopeId
      : typeof payload.envelopeId === "string"
        ? payload.envelopeId
        : null;

  const status =
    typeof data.envelopeSummary === "object" && data.envelopeSummary
      ? String((data.envelopeSummary as Record<string, unknown>).status ?? "")
      : typeof data.status === "string"
        ? data.status
        : typeof payload.status === "string"
          ? payload.status
          : "";

  if (!envelopeId) {
    return NextResponse.json({ received: true });
  }

  const updated = await completeSignatureFromWebhook({
    envelopeId,
    status: status || "completed",
  });

  return NextResponse.json({
    received: true,
    updated: Boolean(updated),
    notification: updated?.signature_status === "vollstaendig"
      ? `✍️ ${updated.signers[0]?.name ?? "Unterzeichner"} hat „${updated.title ?? "Dokument"}“ unterschrieben!`
      : null,
    signature: updated,
  });
}
