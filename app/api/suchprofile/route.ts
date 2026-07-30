import { NextResponse } from "next/server";
import type {
  CreateSuchprofilInput,
  SuchprofilArt,
} from "@/features/matching/types/matching-types";
import {
  createSuchprofilRecord,
  listSuchprofileForCompany,
} from "@/lib/suchprofile/suchprofil-repository";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function parseCreateInput(body: unknown): CreateSuchprofilInput | null {
  if (!body || typeof body !== "object") return null;
  const parsed = body as Partial<CreateSuchprofilInput>;
  if (!parsed.kunde_id?.trim()) return null;

  return {
    kunde_id: parsed.kunde_id.trim(),
    art: parsed.art === "kaufen" ? "kaufen" : ("mieten" satisfies SuchprofilArt),
    objekttyp: Array.isArray(parsed.objekttyp)
      ? parsed.objekttyp.map(String)
      : [],
    zimmer_min: parsed.zimmer_min ?? null,
    zimmer_max: parsed.zimmer_max ?? null,
    flaeche_min: parsed.flaeche_min ?? null,
    flaeche_max: parsed.flaeche_max ?? null,
    preis_max: parsed.preis_max ?? null,
    lagen: Array.isArray(parsed.lagen) ? parsed.lagen.map(String) : [],
    muss_kriterien: Array.isArray(parsed.muss_kriterien)
      ? parsed.muss_kriterien.map(String)
      : [],
    notizen: parsed.notizen ?? null,
    aktiv: parsed.aktiv ?? true,
    auto_erkannt: parsed.auto_erkannt ?? false,
  };
}

export async function GET(request: Request) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const kundeId = url.searchParams.get("kunde_id")?.trim();
  const aktivParam = url.searchParams.get("aktiv");

  const suchprofile = await listSuchprofileForCompany(context.companyId, {
    kunde_id: kundeId,
    aktiv: aktivParam === "1" ? true : aktivParam === "0" ? false : undefined,
  });

  return NextResponse.json({ suchprofile });
}

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

  const input = parseCreateInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "kunde_id ist ein Pflichtfeld." },
      { status: 400 }
    );
  }

  const record = await createSuchprofilRecord(context, input);
  if (!record) {
    return NextResponse.json(
      { error: "Suchprofil konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, suchprofil: record });
}
