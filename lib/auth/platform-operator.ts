import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function parseOperatorEmails(): Set<string> {
  const raw = process.env.HELPY_OPERATOR_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
}

export type PlatformOperatorSnapshot = {
  userId: string | null;
  email: string | null;
  isOperator: boolean;
  source: "profile-flag" | "env-email" | "none" | "dev-fallback";
};

/**
 * HELPY-Betreiber: darf Skill-Freischaltung für alle Mandanten verwalten.
 * Erkennung: profiles.is_platform_operator ODER E-Mail in HELPY_OPERATOR_EMAILS.
 */
export async function getPlatformOperatorSnapshot(): Promise<PlatformOperatorSnapshot> {
  if (!isSupabaseConfigured()) {
    return {
      userId: null,
      email: null,
      isOperator: true,
      source: "dev-fallback",
    };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { userId: null, email: null, isOperator: false, source: "none" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, email: null, isOperator: false, source: "none" };
  }

  const email = user.email?.toLowerCase() ?? null;
  const envOperators = parseOperatorEmails();

  if (email && envOperators.has(email)) {
    return {
      userId: user.id,
      email: user.email ?? null,
      isOperator: true,
      source: "env-email",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_operator")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_platform_operator) {
    return {
      userId: user.id,
      email: user.email ?? null,
      isOperator: true,
      source: "profile-flag",
    };
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    isOperator: false,
    source: "none",
  };
}

export async function isPlatformOperator(): Promise<boolean> {
  const snapshot = await getPlatformOperatorSnapshot();
  return snapshot.isOperator;
}

export function isSupabaseOperatorApiConfigured(): boolean {
  return isSupabaseAdminConfigured();
}

export { createAdminClient };
