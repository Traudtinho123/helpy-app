import { NextResponse } from "next/server";
import { getUserPermissionsSnapshot } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const DEV_PERMISSIONS = {
  userId: "dev-user",
  companyId: "dev-company",
  role: "super_admin" as const,
  isSuperAdmin: true,
  canEditAISettings: true,
  canInviteUsers: true,
  canSwitchSkill: true,
  availableSkills: ["real-estate", "construction", "consulting-legal"] as const,
  profileAllowedSkills: ["real-estate"] as const,
};

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ permissions: DEV_PERMISSIONS });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const permissions = await getUserPermissionsSnapshot(user.id);
  if (!permissions) {
    return NextResponse.json({ error: "Profil nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ permissions });
}
