import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  buildGoogleOAuthStartUrl,
  isGoogleOAuthConfigured,
  requireOAuthContext,
  storeOAuthStartState,
} from "@/lib/oauth";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") ?? "/plattformen";

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json(
      { error: "Google OAuth ist nicht konfiguriert." },
      { status: 503 }
    );
  }

  const auth = await requireOAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const state = randomBytes(16).toString("hex");
  await storeOAuthStartState({
    state,
    provider: "google",
    companyId: auth.context.companyId,
    userId: auth.context.userId,
    returnTo: returnTo.startsWith("/") ? returnTo : "/plattformen",
  });

  return NextResponse.redirect(buildGoogleOAuthStartUrl(state));
}
