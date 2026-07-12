import { canInviteUsers } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type RequireTeamInviteResult =
  | { ok: true; userId: string; companyId: string; companyName: string }
  | { ok: false; status: number; error: string };

export async function requireCanInviteTeamMembers(): Promise<RequireTeamInviteResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: true,
      userId: "dev-user",
      companyId: "dev-company",
      companyName: "Demo Unternehmen",
    };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, status: 401, error: "Nicht authentifiziert." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, error: "Nicht authentifiziert." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, firma")
    .eq("id", user.id)
    .maybeSingle();

  const companyId = profile?.company_id ?? null;

  if (!(await canInviteUsers(user.id, companyId))) {
    return {
      ok: false,
      status: 403,
      error: "Keine Berechtigung zum Einladen von Teammitgliedern.",
    };
  }

  if (!companyId) {
    return { ok: false, status: 400, error: "Kein Unternehmen zugeordnet." };
  }

  return {
    ok: true,
    userId: user.id,
    companyId,
    companyName: profile?.firma?.trim() || "Dein Unternehmen",
  };
}
