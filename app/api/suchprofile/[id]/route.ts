import { NextResponse } from "next/server";
import type { UpdateSuchprofilInput } from "@/features/matching/types/matching-types";
import {
  deleteSuchprofilRecord,
  updateSuchprofilRecord,
} from "@/lib/suchprofile/suchprofil-repository";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function parseUpdateInput(body: unknown): UpdateSuchprofilInput | null {
  if (!body || typeof body !== "object") return null;
  const parsed = body as UpdateSuchprofilInput;
  return {
    art: parsed.art === "kaufen" || parsed.art === "mieten" ? parsed.art : undefined,
    objekttyp: Array.isArray(parsed.objekttyp)
      ? parsed.objekttyp.map(String)
      : undefined,
    zimmer_min: parsed.zimmer_min,
    zimmer_max: parsed.zimmer_max,
    flaeche_min: parsed.flaeche_min,
    flaeche_max: parsed.flaeche_max,
    preis_max: parsed.preis_max,
    lagen: Array.isArray(parsed.lagen) ? parsed.lagen.map(String) : undefined,
    muss_kriterien: Array.isArray(parsed.muss_kriterien)
      ? parsed.muss_kriterien.map(String)
      : undefined,
    notizen: parsed.notizen,
    aktiv: parsed.aktiv,
    auto_erkannt: parsed.auto_erkannt,
  };
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireCompanyContext();
  const companyContext = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const input = parseUpdateInput(body);
  if (!input) {
    return NextResponse.json({ error: "Keine gültigen Felder." }, { status: 400 });
  }

  const record = await updateSuchprofilRecord(companyContext.companyId, id, input);
  if (!record) {
    return NextResponse.json({ error: "Suchprofil nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, suchprofil: record });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireCompanyContext();
  const companyContext = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const ok = await deleteSuchprofilRecord(companyContext.companyId, id);

  if (!ok) {
    return NextResponse.json({ error: "Suchprofil nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
