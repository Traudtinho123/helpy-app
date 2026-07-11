import { NextResponse } from "next/server";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import { HELPY_SKILL_ORDER } from "@/features/workspace/services/workspace/skills";
import { requirePlatformOperatorApi } from "@/lib/auth/require-platform-operator";
import { updateOperatorMemberAllowedSkills } from "@/lib/companies/operator-service";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

const VALID_SKILLS = new Set<string>(HELPY_SKILL_ORDER);

export async function PATCH(request: Request, context: RouteContext) {
  const guard = await requirePlatformOperatorApi();
  if (!guard.ok) return guard.response;

  const { userId } = await context.params;

  try {
    const body = (await request.json()) as { allowedSkills?: string[] };
    const raw = body.allowedSkills ?? [];

    if (raw.length > 1) {
      return NextResponse.json(
        { error: "Aktuell ist maximal ein Skill pro Nutzer erlaubt." },
        { status: 400 }
      );
    }

    const allowedSkills = raw.filter((skill): skill is HelpySkill =>
      VALID_SKILLS.has(skill)
    );

    await updateOperatorMemberAllowedSkills(userId, allowedSkills);

    return NextResponse.json({
      ok: true,
      allowedSkills,
      hasAccess: allowedSkills.length > 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Skill-Freischaltung konnte nicht gespeichert werden.",
      },
      { status: 500 }
    );
  }
}
