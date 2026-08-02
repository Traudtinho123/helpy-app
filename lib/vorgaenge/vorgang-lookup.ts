import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

const devVorgaenge = new Map<string, { kunden_id: string | null; absender_email: string | null }>();

export async function findKundeIdFromVorgaengeByEmail(
  companyId: string,
  email: string
): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) {
    for (const row of devVorgaenge.values()) {
      if (row.absender_email?.toLowerCase() === email && row.kunden_id) {
        return row.kunden_id;
      }
    }
    return null;
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("vorgaenge")
    .select("kunden_id")
    .eq("company_id", companyId)
    .eq("absender_email", email)
    .not("kunden_id", "is", null)
    .limit(1)
    .maybeSingle();

  if (error || !data?.kunden_id) return null;
  return String(data.kunden_id);
}

/** Dev helper for in-memory vorgang rows */
export function registerDevVorgangSenderLookup(
  absenderEmail: string,
  kundenId: string | null
): void {
  devVorgaenge.set(absenderEmail, {
    absender_email: absenderEmail,
    kunden_id: kundenId,
  });
}
