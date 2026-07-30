import type {
  CreateSuchprofilInput,
  SuchprofilRecord,
  UpdateSuchprofilInput,
} from "@/features/matching/types/matching-types";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const devSuchprofile = new Map<string, SuchprofilRecord>();

function generateDevId(): string {
  return `dev-suchprofil-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function rowToRecord(row: Record<string, unknown>): SuchprofilRecord {
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    kunde_id: String(row.kunde_id),
    art: row.art === "kaufen" ? "kaufen" : "mieten",
    objekttyp: Array.isArray(row.objekttyp)
      ? row.objekttyp.map(String)
      : [],
    zimmer_min: row.zimmer_min != null ? Number(row.zimmer_min) : null,
    zimmer_max: row.zimmer_max != null ? Number(row.zimmer_max) : null,
    flaeche_min: row.flaeche_min != null ? Number(row.flaeche_min) : null,
    flaeche_max: row.flaeche_max != null ? Number(row.flaeche_max) : null,
    preis_max: row.preis_max != null ? Number(row.preis_max) : null,
    lagen: Array.isArray(row.lagen) ? row.lagen.map(String) : [],
    muss_kriterien: Array.isArray(row.muss_kriterien)
      ? row.muss_kriterien.map(String)
      : [],
    notizen: typeof row.notizen === "string" ? row.notizen : null,
    aktiv: row.aktiv !== false,
    auto_erkannt: row.auto_erkannt === true,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

export async function listSuchprofileForCompany(
  companyId: string,
  filters?: { kunde_id?: string; aktiv?: boolean }
): Promise<SuchprofilRecord[]> {
  if (!isSupabaseConfigured()) {
    return [...devSuchprofile.values()]
      .filter((item) => item.company_id === companyId)
      .filter((item) =>
        filters?.kunde_id ? item.kunde_id === filters.kunde_id : true
      )
      .filter((item) =>
        filters?.aktiv != null ? item.aktiv === filters.aktiv : true
      )
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
  }

  const supabase = await createClient();
  if (!supabase) return [];

  let query = supabase
    .from("suchprofile")
    .select("*")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });

  if (filters?.kunde_id) query = query.eq("kunde_id", filters.kunde_id);
  if (filters?.aktiv != null) query = query.eq("aktiv", filters.aktiv);

  const { data, error } = await query;
  if (error) {
    console.error("[suchprofile] list failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => rowToRecord(row as Record<string, unknown>));
}

export async function getSuchprofilById(
  companyId: string,
  id: string
): Promise<SuchprofilRecord | null> {
  const all = await listSuchprofileForCompany(companyId);
  return all.find((item) => item.id === id) ?? null;
}

export async function createSuchprofilRecord(
  context: { companyId: string },
  input: CreateSuchprofilInput
): Promise<SuchprofilRecord | null> {
  const now = new Date().toISOString();
  const payload = {
    company_id: context.companyId,
    kunde_id: input.kunde_id,
    art: input.art ?? "mieten",
    objekttyp: input.objekttyp ?? [],
    zimmer_min: input.zimmer_min ?? null,
    zimmer_max: input.zimmer_max ?? null,
    flaeche_min: input.flaeche_min ?? null,
    flaeche_max: input.flaeche_max ?? null,
    preis_max: input.preis_max ?? null,
    lagen: input.lagen ?? [],
    muss_kriterien: input.muss_kriterien ?? [],
    notizen: input.notizen ?? null,
    aktiv: input.aktiv ?? true,
    auto_erkannt: input.auto_erkannt ?? false,
    updated_at: now,
  };

  if (!isSupabaseConfigured()) {
    const record: SuchprofilRecord = {
      id: generateDevId(),
      ...payload,
      created_at: now,
    };
    devSuchprofile.set(record.id, record);
    return record;
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("suchprofile")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[suchprofile] insert failed:", error?.message);
    return null;
  }

  return rowToRecord(data as Record<string, unknown>);
}

export async function updateSuchprofilRecord(
  companyId: string,
  id: string,
  input: UpdateSuchprofilInput
): Promise<SuchprofilRecord | null> {
  const existing = await getSuchprofilById(companyId, id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const next: SuchprofilRecord = {
    ...existing,
    ...input,
    objekttyp: input.objekttyp ?? existing.objekttyp,
    lagen: input.lagen ?? existing.lagen,
    muss_kriterien: input.muss_kriterien ?? existing.muss_kriterien,
    updated_at: now,
  };

  if (!isSupabaseConfigured()) {
    devSuchprofile.set(id, next);
    return next;
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("suchprofile")
    .update({
      art: next.art,
      objekttyp: next.objekttyp,
      zimmer_min: next.zimmer_min,
      zimmer_max: next.zimmer_max,
      flaeche_min: next.flaeche_min,
      flaeche_max: next.flaeche_max,
      preis_max: next.preis_max,
      lagen: next.lagen,
      muss_kriterien: next.muss_kriterien,
      notizen: next.notizen,
      aktiv: next.aktiv,
      auto_erkannt: next.auto_erkannt,
      updated_at: now,
    })
    .eq("id", id)
    .eq("company_id", companyId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[suchprofile] update failed:", error?.message);
    return null;
  }

  return rowToRecord(data as Record<string, unknown>);
}

export async function deleteSuchprofilRecord(
  companyId: string,
  id: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return devSuchprofile.delete(id);
  }

  const supabase = await createClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("suchprofile")
    .delete()
    .eq("id", id)
    .eq("company_id", companyId);

  if (error) {
    console.error("[suchprofile] delete failed:", error.message);
    return false;
  }

  return true;
}

/** Dev/test helper */
export function resetDevSuchprofile(): void {
  devSuchprofile.clear();
}
