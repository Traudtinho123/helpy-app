import { NextResponse } from "next/server";
import { requirePlatformOperatorApi } from "@/lib/auth/require-platform-operator";
import { listOperatorCompanyMembers } from "@/lib/companies/operator-service";

type RouteContext = {
  params: Promise<{ companyId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const guard = await requirePlatformOperatorApi();
  if (!guard.ok) return guard.response;

  const { companyId } = await context.params;

  try {
    const members = await listOperatorCompanyMembers(companyId);
    return NextResponse.json({ members });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Mitglieder konnten nicht geladen werden.",
      },
      { status: 500 }
    );
  }
}
