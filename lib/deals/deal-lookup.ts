import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export async function findKundeIdFromDealsByEmail(
  companyId: string,
  email: string
): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("deals")
    .select("kunde_id, kunden: kunde_id ( email )")
    .eq("company_id", companyId)
    .limit(200);

  if (error || !data) return null;

  for (const row of data as Array<{ kunde_id?: string | null; kunden?: { email?: string } | null }>) {
    const kunde = row.kunden;
    if (kunde?.email?.toLowerCase() === email && row.kunde_id) {
      return String(row.kunde_id);
    }
  }

  return null;
}
