import { NextResponse } from "next/server";
import type { MatchScoreBreakdown } from "@/features/matching/types/matching-types";
import { MATCH_THRESHOLD } from "@/features/matching/types/matching-types";
import {
  createObjektMatchRecord,
  listMatchesForCompany,
  markMatchKontaktiert,
} from "@/lib/matches/objekt-match-repository";
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

  const url = new URL(request.url);
  const objektId = url.searchParams.get("objekt_id")?.trim();
  const kundeId = url.searchParams.get("kunde_id")?.trim();
  const today = url.searchParams.get("today") === "1";

  const since = today
    ? new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
    : undefined;

  const matches = await listMatchesForCompany(context.companyId, {
    objekt_id: objektId,
    kunde_id: kundeId,
    since,
    minScore: MATCH_THRESHOLD,
  });

  return NextResponse.json({ matches });
}

type MatchPayload = {
  kunde_id: string;
  suchprofil_id: string;
  score: number;
  score_details: MatchScoreBreakdown;
};

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

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  const parsed = body as {
    objekt_id?: string;
    matches?: MatchPayload[];
    match_id?: string;
    kontaktiert?: boolean;
  };

  if (parsed.match_id && parsed.kontaktiert) {
    const ok = await markMatchKontaktiert(context.companyId, parsed.match_id);
    return NextResponse.json({ ok });
  }

  if (!parsed.objekt_id?.trim() || !Array.isArray(parsed.matches)) {
    return NextResponse.json(
      { error: "objekt_id und matches sind Pflichtfelder." },
      { status: 400 }
    );
  }

  const created = [];
  for (const match of parsed.matches) {
    if (match.score < MATCH_THRESHOLD) continue;
    const record = await createObjektMatchRecord({
      company_id: context.companyId,
      objekt_id: parsed.objekt_id.trim(),
      kunde_id: match.kunde_id,
      suchprofil_id: match.suchprofil_id,
      score: match.score,
      score_details: match.score_details,
    });
    if (record) created.push(record);
  }

  return NextResponse.json({ ok: true, matches: created });
}
