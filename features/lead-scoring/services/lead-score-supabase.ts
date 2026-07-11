import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { LeadScoreRecord } from "@/features/lead-scoring/types/lead-scoring-types";

export async function resolveCompanyIdForUser(userId: string): Promise<string | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.company_id) return null;
  return data.company_id;
}

export async function upsertLeadScoresInDatabase(
  companyId: string,
  records: LeadScoreRecord[],
  client?: SupabaseClient
): Promise<number> {
  const supabase = client ?? (await createClient());
  if (!supabase || records.length === 0) return 0;

  let updated = 0;

  for (const record of records) {
    if (!record.email) continue;

    const { error } = await supabase
      .from("kunden")
      .update({
        score_value: record.score,
        score_updated_at: record.updatedAt,
      })
      .eq("company_id", companyId)
      .ilike("email", record.email);

    if (!error) {
      updated += 1;
    }
  }

  return updated;
}

export async function fetchLeadScoresFromDatabase(
  companyId: string
): Promise<LeadScoreRecord[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("kunden")
    .select("id, email, score_value, score_updated_at")
    .eq("company_id", companyId)
    .not("score_value", "is", null);

  if (error || !data) return [];

  return data
    .filter((row) => row.score_value != null && row.score_updated_at)
    .map((row) => ({
      customerKey: row.id,
      email: row.email,
      score: row.score_value as number,
      updatedAt: row.score_updated_at as string,
    }));
}
