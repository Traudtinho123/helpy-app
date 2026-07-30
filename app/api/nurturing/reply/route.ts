import { NextResponse } from "next/server";
import { markNurturingReplied } from "@/lib/nurturing/nurturing-repository";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Markiert Nurturing-Mails als beantwortet (HELPY Reply-Detection). */
export async function POST(request: Request) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { gmailThreadId?: string; fromEmail?: string } = {};
  try {
    body = (await request.json()) as {
      gmailThreadId?: string;
      fromEmail?: string;
    };
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  const updated = await markNurturingReplied({
    companyId: context.companyId,
    gmailThreadId: body.gmailThreadId ?? null,
    toEmail: body.fromEmail ?? null,
  });

  return NextResponse.json({ updated });
}
