import { createClient } from "@/lib/supabase/server";
import type { OAuthAuthContext } from "@/lib/oauth/types";

export type RequireOAuthContextResult =
  | { ok: true; context: OAuthAuthContext }
  | { ok: false; error: string; status: 401 | 403 };

/** Lädt User + company_id für OAuth-Operationen (Server-API). */
export async function requireOAuthContext(): Promise<RequireOAuthContextResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, error: "Supabase nicht konfiguriert.", status: 401 };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Nicht angemeldet.", status: 401 };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[oauth] profile load failed:", profileError.message);
  }

  const companyId = profile?.company_id ?? null;
  if (!companyId) {
    return {
      ok: false,
      error: "Kein Unternehmen zugeordnet.",
      status: 403,
    };
  }

  return {
    ok: true,
    context: {
      userId: user.id,
      companyId,
      userEmail: user.email ?? null,
    },
  };
}

/** Dev-Fallback wenn Supabase fehlt — lokales Testen ohne DB. */
export function createDevOAuthContext(): OAuthAuthContext {
  return {
    userId: "dev-user",
    companyId: "dev-company",
    userEmail: "dev@helpy.local",
  };
}
