import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database/types";
import { SUPABASE_URL } from "@/lib/supabase/config";

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

export function getSupabaseServiceRoleKeyIssue(): string | null {
  if (!SERVICE_ROLE_KEY) {
    return "SUPABASE_SERVICE_ROLE_KEY fehlt in .env.local / Vercel.";
  }
  if (SERVICE_ROLE_KEY.startsWith("sb_publishable_")) {
    return "SUPABASE_SERVICE_ROLE_KEY ist ein Publishable Key (sb_publishable_…). Bitte den service_role Secret Key eintragen: Supabase Dashboard → Project Settings → API → service_role → Reveal.";
  }
  if (!SERVICE_ROLE_KEY.startsWith("eyJ")) {
    return "SUPABASE_SERVICE_ROLE_KEY hat ein ungültiges Format. Erwartet wird ein JWT, der mit eyJ beginnt.";
  }
  return null;
}

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY && !getSupabaseServiceRoleKeyIssue());
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
