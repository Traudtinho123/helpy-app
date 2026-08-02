import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import type { OAuthAuthContext } from "@/lib/oauth/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type ResolvedCompanyApiContext = OAuthAuthContext & {
  authenticated: boolean;
};

/**
 * Für Lese-APIs: Dev-Fallback ohne Supabase, sonst null wenn nicht angemeldet.
 * Gibt nie 403 zurück — Caller liefert leere Daten.
 */
export async function resolveCompanyContextForReadApi(): Promise<ResolvedCompanyApiContext | null> {
  const auth = await requireCompanyContext();
  if (auth.ok) {
    return { ...auth.context, authenticated: true };
  }

  if (!isSupabaseConfigured()) {
    return { ...createDevCompanyContext(), authenticated: false };
  }

  return null;
}

/** Für Schreib-APIs: strikte Auth, Dev-Fallback nur ohne Supabase. */
export async function resolveCompanyContextForWriteApi(): Promise<
  | { ok: true; context: ResolvedCompanyApiContext }
  | { ok: false; error: string; status: 401 | 403 }
> {
  const auth = await requireCompanyContext();
  if (auth.ok) {
    return { ok: true, context: { ...auth.context, authenticated: true } };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      context: { ...createDevCompanyContext(), authenticated: false },
    };
  }

  return { ok: false, error: auth.error, status: auth.status };
}
