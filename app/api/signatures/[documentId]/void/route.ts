import { NextResponse } from "next/server";
import { voidDocuSignEnvelope } from "@/lib/docusign/client";
import {
  findSignatureByDocumentId,
  updateSignatureStatus,
} from "@/lib/signatures/signature-repository";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type RouteContext = { params: Promise<{ documentId: string }> };

export async function POST(_request: Request, context: RouteContext) {
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

  if (!record?.signature_envelope_id) {
    return NextResponse.json({ error: "Keine Signatur-Anfrage gefunden." }, { status: 404 });
  }

  await voidDocuSignEnvelope(record.signature_envelope_id, "Vom Makler abgebrochen");

  const updated = await updateSignatureStatus(record.id, {
    signature_status: "abgebrochen",
  });

  return NextResponse.json({ signature: updated });
}
