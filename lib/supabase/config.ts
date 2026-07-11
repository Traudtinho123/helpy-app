export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
/** Legacy JWT anon key or newer `sb_publishable_…` key from Supabase Dashboard → API */
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  "Supabase ist noch nicht konfiguriert. Bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY (oder NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in .env.local eintragen.";
