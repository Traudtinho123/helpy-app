import { NextResponse } from "next/server";
import { requireCompanyMember } from "@/lib/auth/require-company-member";
import { fetchCompanyTeamMembers } from "@/lib/team/services/team-repository";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const access = await requireCompanyMember();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const members = await fetchCompanyTeamMembers(supabase, access.companyId);
  return NextResponse.json({ members });
}
