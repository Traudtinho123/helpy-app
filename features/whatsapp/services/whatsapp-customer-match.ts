import { normalizePhone } from "@/features/crm/services/crm-merge";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database/types";

export async function findCustomerIdByPhone(
  client: SupabaseClient<Database>,
  companyId: string,
  fromNumber: string
): Promise<{ id: string; name: string | null } | null> {
  const normalizedIncoming = normalizePhone(fromNumber);
  if (normalizedIncoming.length < 6) return null;

  const { data, error } = await client
    .from("kunden")
    .select("id, firmenname, ansprechpartner, telefon")
    .eq("company_id", companyId)
    .not("telefon", "is", null)
    .limit(200);

  if (error || !data) return null;

  for (const row of data) {
    if (normalizePhone(row.telefon ?? "") === normalizedIncoming) {
      const name =
        row.ansprechpartner?.trim() || row.firmenname?.trim() || null;
      return { id: row.id, name };
    }
  }

  return null;
}
