import { NextResponse } from "next/server";
import {
  findSignatureByDocumentId,
  listSignaturesForCompany,
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
