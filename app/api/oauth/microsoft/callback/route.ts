import { NextResponse } from "next/server";
import {
  buildOAuthReturnUrl,
  consumeOAuthStartState,
  exchangeMicrosoftAuthCode,
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
      buildOAuthReturnUrl(origin, "microsoft", "error", oauthError)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      buildOAuthReturnUrl(origin, "microsoft", "error", "OAuth-Status ungültig.")
    );
  }

  const startState = await consumeOAuthStartState(state);
  if (!startState || startState.provider !== "microsoft") {
    return NextResponse.redirect(
      buildOAuthReturnUrl(origin, "microsoft", "error", "OAuth-Sitzung abgelaufen.")
    );
  }

  try {
    const tokens = await exchangeMicrosoftAuthCode(code);
    await upsertOAuthConnection({
      companyId: startState.companyId,
      userId: startState.userId,
      provider: "microsoft",
      tokens,
    });
    return NextResponse.redirect(
      buildOAuthReturnUrl(origin, "microsoft", "connected")
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Outlook-Verbindung fehlgeschlagen.";
    return NextResponse.redirect(
      buildOAuthReturnUrl(origin, "microsoft", "error", message)
    );
  }
}
