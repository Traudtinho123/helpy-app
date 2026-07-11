import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import {
  getSkillAccessForCurrentUser,
  isSkillInAccess,
  type SkillAccessSnapshot,
} from "@/lib/auth/skill-access";
import { AUTH_ROUTES } from "@/lib/auth/routes";

export type RequireSkillAccessResult =
  | { ok: true; access: SkillAccessSnapshot }
  | { ok: false; response: NextResponse };

/**
 * API-Guard: Session + freigeschalteter Skill erforderlich.
 * Optional: expliziten Skill verlangen (sonst reicht hasAccess).
 */
export async function requireSkillAccessApi(
  requiredSkill?: HelpySkill
): Promise<RequireSkillAccessResult> {
  const access = await getSkillAccessForCurrentUser();

  if (!access.userId && access.source !== "dev-fallback") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Nicht angemeldet." },
        { status: 401 }
      ),
    };
  }

  if (!access.hasAccess) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Zugang noch nicht freigeschaltet.",
          code: "SKILL_ACCESS_PENDING",
        },
        { status: 403 }
      ),
    };
  }

  if (requiredSkill && !isSkillInAccess(access, requiredSkill)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Dieser HELPY-Skill ist für dein Konto nicht freigeschaltet.",
          code: "SKILL_NOT_ALLOWED",
          allowedSkills: access.allowedSkills,
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true, access };
}

/**
 * Page-Guard: ohne freigeschalteten Skill → /zugang-ausstehend.
 */
export async function requireSkillAccessPage(): Promise<SkillAccessSnapshot> {
  const access = await getSkillAccessForCurrentUser();

  if (!access.userId && access.source !== "dev-fallback") {
    redirect(AUTH_ROUTES.login);
  }

  if (!access.hasAccess) {
    redirect(AUTH_ROUTES.pendingAccess);
  }

  return access;
}
