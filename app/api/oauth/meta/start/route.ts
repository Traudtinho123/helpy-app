import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  buildMetaOAuthStartUrl,
  isMetaOAuthConfigured,
} from "@/lib/oauth/meta-oauth-server";
import { requireCompanyContext } from "@/lib/tenant/require-company-context";
import { storeSocialOAuthStartState } from "@/lib/oauth/social-oauth-state-cookie";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") ?? "/plattformen";

  if (!isMetaOAuthConfigured()) {
    return NextResponse.json(
      { error: "Meta OAuth ist nicht konfiguriert (META_APP_ID / META_APP_SECRET)." },
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
    provider: "meta",
    companyId: auth.context.companyId,
    userId: auth.context.userId,
    returnTo: returnTo.startsWith("/") ? returnTo : "/plattformen",
  });

  return NextResponse.redirect(buildMetaOAuthStartUrl(state));
}
