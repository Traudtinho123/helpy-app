import { NextResponse } from "next/server";
import { resolveSenderIntelligence } from "@/lib/vorgaenge/sender-intelligence";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const parsed = body as {
    fromEmail?: string;
    fromName?: string;
    subject?: string;
    body?: string;
    isSpam?: boolean;
  };

  const intelligence = await resolveSenderIntelligence({
    companyId: context.companyId,
    fromEmail: parsed.fromEmail ?? null,
    fromName: parsed.fromName ?? "",
    subject: parsed.subject ?? "",
    body: parsed.body ?? "",
    isSpam: parsed.isSpam ?? false,
  });

  return NextResponse.json({ ok: true, intelligence });
}
