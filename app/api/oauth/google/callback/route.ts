import { NextResponse } from "next/server";
import {
  buildOAuthReturnUrl,
  consumeOAuthStartState,
  exchangeGoogleAuthCode,
  upsertOAuthConnection,
} from "@/lib/oauth";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error_description");

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    `${url.protocol}//${url.host}`;

  if (oauthError) {
    return NextResponse.redirect(
      buildOAuthReturnUrl(origin, "google", "error", oauthError)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      buildOAuthReturnUrl(origin, "google", "error", "OAuth-Status ungültig.")
    );
  }

  const startState = await consumeOAuthStartState(state);
  if (!startState || startState.provider !== "google") {
    return NextResponse.redirect(
      buildOAuthReturnUrl(origin, "google", "error", "OAuth-Sitzung abgelaufen.")
    );
  }

  try {
    const tokens = await exchangeGoogleAuthCode(code);
    await upsertOAuthConnection({
      companyId: startState.companyId,
      userId: startState.userId,
      provider: "google",
      tokens,
    });
    return NextResponse.redirect(
      buildOAuthReturnUrl(origin, "google", "connected", undefined, startState.returnTo)
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Google-Verbindung fehlgeschlagen.";
    return NextResponse.redirect(
      buildOAuthReturnUrl(origin, "google", "error", message, startState.returnTo)
    );
  }
}
