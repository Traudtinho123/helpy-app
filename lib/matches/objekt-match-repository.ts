import type {
  MatchScoreBreakdown,
  ObjektMatchRecord,
  ObjektMatchWithKunde,
} from "@/features/matching/types/matching-types";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const devMatches = new Map<string, ObjektMatchRecord>();

function generateDevId(): string {
  return `dev-match-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseBreakdown(value: unknown): MatchScoreBreakdown {
  if (!value || typeof value !== "object") {
    return { preis: 0, zimmer: 0, lage: 0, objekttyp: 0, muss_kriterien: 0 };
  }
  const row = value as Record<string, unknown>;
  return {
    preis: Number(row.preis ?? 0),
    zimmer: Number(row.zimmer ?? 0),
    lage: Number(row.lage ?? 0),
    objekttyp: Number(row.objekttyp ?? 0),
    muss_kriterien: Number(row.muss_kriterien ?? 0),
  };
}

function rowToMatch(row: Record<string, unknown>): ObjektMatchRecord {
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    objekt_id: String(row.objekt_id),
    kunde_id: String(row.kunde_id),
    suchprofil_id: String(row.suchprofil_id),
    score: Number(row.score),
    score_details: parseBreakdown(row.score_details),
    notified: row.notified === true,
    kontaktiert: row.kontaktiert === true,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function listMatchesForCompany(
  companyId: string,
  filters?: {
    objekt_id?: string;
    kunde_id?: string;
    since?: string;
    minScore?: number;
  }
): Promise<ObjektMatchWithKunde[]> {
  if (!isSupabaseConfigured()) {
    return [...devMatches.values()]
      .filter((item) => item.company_id === companyId)
      .filter((item) =>
        filters?.objekt_id ? item.objekt_id === filters.objekt_id : true
      )
      .filter((item) =>
        filters?.kunde_id ? item.kunde_id === filters.kunde_id : true
      )
      .filter((item) =>
        filters?.since
          ? new Date(item.created_at) >= new Date(filters.since)
          : true
      )
      .filter((item) =>
        filters?.minScore != null ? item.score >= filters.minScore : true
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .map((item) => ({ ...item, kunde_name: null, kunde_email: null, kunde_telefon: null }));
  }

  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase
    .from("objekt_matches")
    .select(
      "*, kunden: kunde_id ( ansprechpartner, firmenname, email, telefon )"
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (filters?.objekt_id) query = query.eq("objekt_id", filters.objekt_id);
  if (filters?.kunde_id) query = query.eq("kunde_id", filters.kunde_id);
  if (filters?.since) query = query.gte("created_at", filters.since);
  if (filters?.minScore != null) query = query.gte("score", filters.minScore);

  const { data, error } = await query;
  if (error) {
    console.error("[objekt_matches] list failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const match = rowToMatch(row as Record<string, unknown>);
    const kunde = (row as Record<string, unknown>).kunden as
      | Record<string, unknown>
      | null
      | undefined;
    const ansprechpartner =
      typeof kunde?.ansprechpartner === "string" ? kunde.ansprechpartner : null;
    const firmenname =
      typeof kunde?.firmenname === "string" ? kunde.firmenname : null;

    return {
      ...match,
      kunde_name: ansprechpartner ?? firmenname ?? null,
      kunde_email: typeof kunde?.email === "string" ? kunde.email : null,
      kunde_telefon: typeof kunde?.telefon === "string" ? kunde.telefon : null,
    };
  });
}

export async function createObjektMatchRecord(input: {
  company_id: string;
  objekt_id: string;
  kunde_id: string;
  suchprofil_id: string;
  score: number;
  score_details: MatchScoreBreakdown;
}): Promise<ObjektMatchRecord | null> {
  const payload = {
    ...input,
    score_details: input.score_details,
    notified: false,
    kontaktiert: false,
  };

  if (!isSupabaseConfigured()) {
    const record: ObjektMatchRecord = {
      id: generateDevId(),
      ...payload,
      created_at: new Date().toISOString(),
    };
    devMatches.set(record.id, record);
    return record;
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("objekt_matches")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[objekt_matches] insert failed:", error?.message);
    return null;
  }

  return rowToMatch(data as Record<string, unknown>);
}

export async function markMatchNotified(
  companyId: string,
  matchId: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const existing = devMatches.get(matchId);
    if (!existing || existing.company_id !== companyId) return false;
    devMatches.set(matchId, { ...existing, notified: true });
    return true;
  }

  const supabase = await createClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("objekt_matches")
    .update({ notified: true })
    .eq("id", matchId)
    .eq("company_id", companyId);

  return !error;
}

export async function markMatchKontaktiert(
  companyId: string,
  matchId: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const existing = devMatches.get(matchId);
    if (!existing || existing.company_id !== companyId) return false;
    devMatches.set(matchId, { ...existing, kontaktiert: true });
    return true;
  }

  const supabase = await createClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("objekt_matches")
    .update({ kontaktiert: true })
    .eq("id", matchId)
    .eq("company_id", companyId);

  return !error;
}

export function resetDevMatches(): void {
  devMatches.clear();
}
