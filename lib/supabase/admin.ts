import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database/types";
import { SUPABASE_URL } from "@/lib/supabase/config";

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

/** Server-only — voller DB-Zugriff (Skill-Freischaltung, auth.users). */
export function createAdminClient(): SupabaseClient<Database> | null {
  if (!isSupabaseAdminConfigured()) {
    return null;
  }

  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
