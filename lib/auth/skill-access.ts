import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { HelpySkillDb } from "@/lib/database/types";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SKILL_ACCESS_CONTACT_EMAIL } from "@/lib/auth/skill-access-constants";
import { normalizeAllowedSkills } from "@/lib/auth/skill-access-shared";

export { SKILL_ACCESS_CONTACT_EMAIL };
export { normalizeAllowedSkills } from "@/lib/auth/skill-access-shared";

export type SkillAccessSnapshot = {
  /** Alle freigeschalteten Skills (Array für spätere Multi-Skill-Nutzung). */
  allowedSkills: HelpySkill[];
  /** Primärer Skill (= erster Eintrag). null = noch nicht freigeschaltet. */
  activeSkill: HelpySkill | null;
  /** true wenn mindestens ein Skill freigeschaltet ist. */
  hasAccess: boolean;
  /** Quelle: DB-Profil oder lokaler Dev-Fallback. */
  source: "database" | "dev-fallback" | "unauthenticated";
  userId: string | null;
  email: string | null;
};

const EMPTY_ACCESS: SkillAccessSnapshot = {
  allowedSkills: [],
  activeSkill: null,
  hasAccess: false,
  source: "unauthenticated",
  userId: null,
  email: null,
};

/**
 * Lädt freigeschaltete Skills aus profiles.allowed_skills (Server).
 * Ohne Supabase-Config: Dev-Fallback real-estate, damit lokales Arbeiten möglich bleibt.
 */
export async function getSkillAccessForCurrentUser(): Promise<SkillAccessSnapshot> {
  if (!isSupabaseConfigured()) {
    return {
      allowedSkills: ["real-estate"],
      activeSkill: "real-estate",
      hasAccess: true,
      source: "dev-fallback",
      userId: null,
      email: null,
    };
  }

  const supabase = await createClient();
  if (!supabase) {
    return EMPTY_ACCESS;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return EMPTY_ACCESS;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("allowed_skills")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[skill-access] profiles load failed:", profileError.message);
  }

  const allowedSkills = normalizeAllowedSkills(
    (profile?.allowed_skills as HelpySkillDb[] | null | undefined) ?? []
  );

  return {
    allowedSkills,
    activeSkill: allowedSkills[0] ?? null,
    hasAccess: allowedSkills.length > 0,
    source: "database",
    userId: user.id,
    email: user.email ?? null,
  };
}

export function isSkillInAccess(
  access: SkillAccessSnapshot,
  skill: HelpySkill
): boolean {
  return access.allowedSkills.includes(skill);
}
