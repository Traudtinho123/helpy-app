import { NextResponse } from "next/server";
import { getSkillAccessForCurrentUser } from "@/lib/auth/skill-access";

export async function GET() {
  const access = await getSkillAccessForCurrentUser();

  if (!access.userId && access.source !== "dev-fallback") {
    return NextResponse.json(
      { error: "Nicht angemeldet.", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    allowedSkills: access.allowedSkills,
    activeSkill: access.activeSkill,
    hasAccess: access.hasAccess,
    email: access.email,
    source: access.source,
  });
}
