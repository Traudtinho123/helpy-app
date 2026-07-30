import { NextResponse } from "next/server";
import { setMonatszielForCompany } from "@/lib/finanzen/monatsziel-store";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function PATCH(request: Request) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { monatsziel?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  const monatsziel = setMonatszielForCompany(
    context.companyId,
    body.monatsziel ?? 0
  );

  return NextResponse.json({ monatsziel });
}
