import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database/types";
import {
  isSupabaseConfigured,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "@/lib/supabase/config";

export type TypedSupabaseClient = SupabaseClient<Database>;

let typedBrowserClient: TypedSupabaseClient | null = null;

export function createTypedClient(): TypedSupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!typedBrowserClient) {
    typedBrowserClient = createBrowserClient<Database>(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
  }

  return typedBrowserClient;
}

export function resetTypedBrowserClient() {
  typedBrowserClient = null;
}
