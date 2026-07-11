import { NextResponse } from "next/server";
import { requirePlatformOperatorApi } from "@/lib/auth/require-platform-operator";
import {
  createOperatorCompany,
  listOperatorCompanies,
} from "@/lib/companies/operator-service";

export async function GET() {
  const guard = await requirePlatformOperatorApi();
  if (!guard.ok) return guard.response;

  try {
    const companies = await listOperatorCompanies();
    return NextResponse.json({ companies });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unternehmen konnten nicht geladen werden.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const guard = await requirePlatformOperatorApi();
  if (!guard.ok) return guard.response;

  try {
    const body = (await request.json()) as { name?: string };
    const result = await createOperatorCompany(body.name ?? "");
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unternehmen konnte nicht angelegt werden.",
      },
      { status: 400 }
    );
  }
}
