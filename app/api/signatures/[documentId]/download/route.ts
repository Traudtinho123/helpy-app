import { NextResponse } from "next/server";
import { downloadSignedDocuSignPdf } from "@/lib/docusign/client";
import {
  findSignatureByDocumentId,
  updateSignatureStatus,
  uploadSignedPdf,
} from "@/lib/signatures/signature-repository";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type RouteContext = { params: Promise<{ documentId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireCompanyContext();
  const authContext = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { documentId } = await context.params;
  const record = await findSignatureByDocumentId(
    authContext.companyId,
    decodeURIComponent(documentId)
  );

  if (!record) {
    return NextResponse.json({ error: "Dokument nicht gefunden." }, { status: 404 });
  }

  let signedUrl = record.signed_document_url;

  if (!signedUrl && record.signature_envelope_id) {
    const pdf = await downloadSignedDocuSignPdf(record.signature_envelope_id);
    if (pdf) {
      signedUrl = await uploadSignedPdf(
        authContext.companyId,
        record.signature_envelope_id,
        pdf,
        `${record.helpy_document_id}-signed.pdf`
      );
      if (signedUrl) {
        await updateSignatureStatus(record.id, { signed_document_url: signedUrl });
      }
    }
  }

  if (!signedUrl) {
    return NextResponse.json(
      { error: "Signiertes PDF noch nicht verfügbar." },
      { status: 404 }
    );
  }

  return NextResponse.redirect(signedUrl);
}
