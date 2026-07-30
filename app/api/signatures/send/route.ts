import { NextResponse } from "next/server";
import { createDocuSignEnvelope } from "@/lib/docusign/client";
import { isDocuSignConfigured } from "@/lib/docusign/config";
import {
  findSignatureByDocumentId,
  listSignaturesForCompany,
  upsertSignatureRecord,
} from "@/lib/signatures/signature-repository";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("document_id");

  if (documentId) {
    const signature = await findSignatureByDocumentId(
      context.companyId,
      documentId
    );
    return NextResponse.json({ signature });
  }

  const signatures = await listSignaturesForCompany(context.companyId);
  return NextResponse.json({ signatures });
}

export async function POST(request: Request) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: {
    documentId?: string;
    documentTitle?: string;
    fileName?: string;
    pdfBase64?: string;
    signers?: { name: string; email: string }[];
    message?: string;
    vorgangId?: string | null;
    kundeId?: string | null;
    objektId?: string | null;
    dealId?: string | null;
    useEmailFallback?: boolean;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  if (
    !body.documentId?.trim() ||
    !body.fileName?.trim() ||
    !body.pdfBase64?.trim() ||
    !body.signers?.length
  ) {
    return NextResponse.json(
      { error: "documentId, fileName, pdfBase64 und signers sind Pflicht." },
      { status: 400 }
    );
  }

  const signers = body.signers.filter(
    (signer) => signer.email.trim() && signer.name.trim()
  );

  if (signers.length === 0) {
    return NextResponse.json(
      { error: "Mindestens ein Unterzeichner erforderlich." },
      { status: 400 }
    );
  }

  const message =
    body.message?.trim() ??
    "Bitte unterzeichnen Sie das beigefügte Dokument elektronisch.";

  const useFallback = body.useEmailFallback || !isDocuSignConfigured();

  let envelopeId: string;
  let provider: "docusign" | "email_fallback" | "mock";

  if (useFallback) {
    envelopeId = `email-${Date.now()}`;
    provider = "email_fallback";
  } else {
    const envelope = await createDocuSignEnvelope({
      fileName: body.fileName,
      pdfBase64: body.pdfBase64,
      signers,
      emailSubject: `Unterschrift: ${body.documentTitle ?? body.fileName}`,
      emailMessage: message,
    });
    envelopeId = envelope.envelopeId;
    provider = envelope.provider;
  }

  const signature = await upsertSignatureRecord(context.companyId, {
    documentId: body.documentId.trim(),
    documentTitle: body.documentTitle ?? body.fileName,
    fileName: body.fileName,
    pdfBase64: body.pdfBase64,
    signers,
    message,
    vorgangId: body.vorgangId,
    kundeId: body.kundeId,
    objektId: body.objektId,
    dealId: body.dealId,
    envelopeId,
    provider,
    status: "gesendet",
  });

  if (!signature) {
    return NextResponse.json(
      { error: "Signatur-Anfrage konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    signature,
    fallback: useFallback,
    message: useFallback
      ? "DocuSign nicht konfiguriert — PDF per E-Mail-Fallback vorbereitet."
      : "Signatur-Anfrage gesendet.",
  });
}
