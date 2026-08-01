import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  buildLinkedInOAuthStartUrl,
  isLinkedInOAuthConfigured,
} from "@/lib/oauth/linkedin-oauth-server";
import { requireCompanyContext } from "@/lib/tenant/require-company-context";
import { storeSocialOAuthStartState } from "@/lib/oauth/social-oauth-state-cookie";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") ?? "/plattformen";

  if (!isLinkedInOAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "LinkedIn OAuth ist nicht konfiguriert (LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET).",
      },
      { status: 503 }
    );
  }

  const auth = await requireCompanyContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const state = randomBytes(16).toString("hex");
  await storeSocialOAuthStartState({
    state,
    provider: "linkedin",
    companyId: auth.context.companyId,
    userId: auth.context.userId,
    returnTo: returnTo.startsWith("/") ? returnTo : "/plattformen",
  });

  return NextResponse.redirect(buildLinkedInOAuthStartUrl(state));
}
