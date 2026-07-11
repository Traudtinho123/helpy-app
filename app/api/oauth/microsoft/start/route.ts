import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  buildMicrosoftOAuthStartUrl,
  isMicrosoftOAuthConfigured,
  requireOAuthContext,
  storeOAuthStartState,
} from "@/lib/oauth";

export async function GET(): Promise<NextResponse> {
  if (!isMicrosoftOAuthConfigured()) {
    return NextResponse.json(
      { error: "Microsoft OAuth ist nicht konfiguriert." },
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
    provider: "microsoft",
    companyId: auth.context.companyId,
    userId: auth.context.userId,
    returnTo: "/plattformen",
  });

  return NextResponse.redirect(buildMicrosoftOAuthStartUrl(state));
}
