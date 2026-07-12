import { NextResponse } from "next/server";
import { requireCompanyMember } from "@/lib/auth/require-company-member";
import { fetchCompanyTeamMembers } from "@/lib/team/services/team-repository";

export async function GET() {
  const access = await requireCompanyMember();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const members = await fetchCompanyTeamMembers(access.companyId);
  return NextResponse.json({ members });
}
