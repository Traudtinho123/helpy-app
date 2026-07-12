import { NextResponse } from "next/server";
import { canEditAISettings } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type RequireAISettingsResult =
  | { ok: true; userId: string; companyId: string }
  | { ok: false; status: number; error: string };

export async function requireCanEditAISettings(): Promise<RequireAISettingsResult> {
  if (!isSupabaseConfigured()) {
    return { ok: true, userId: "dev-user", companyId: "dev-company" };
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
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();

  const companyId = profile?.company_id ?? null;

  if (!(await canEditAISettings(user.id, companyId))) {
    return {
      ok: false,
      status: 403,
      error: "Nur Admins können KI-Einstellungen ändern.",
    };
  }

  if (!companyId) {
    return { ok: false, status: 400, error: "Kein Unternehmen zugeordnet." };
  }

  return { ok: true, userId: user.id, companyId };
}

export function aiSettingsForbiddenResponse(error: string): NextResponse {
  return NextResponse.json({ error }, { status: 403 });
}
