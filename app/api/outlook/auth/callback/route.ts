import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  exchangeOutlookAuthCode,
  storeOutlookTokensInCookies,
} from "@/features/outlook/services/outlook-auth-server";
import { OUTLOOK_OAUTH_STATE_COOKIE } from "@/features/outlook/services/outlook-auth-server";

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
      `${origin}/plattformen?outlook=error&message=${encodeURIComponent(oauthError)}`
    );
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OUTLOOK_OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OUTLOOK_OAUTH_STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      `${origin}/plattformen?outlook=error&message=${encodeURIComponent("OAuth-Status ungültig.")}`
    );
  }

  try {
    const tokens = await exchangeOutlookAuthCode(code);
    await storeOutlookTokensInCookies(tokens);
    return NextResponse.redirect(`${origin}/plattformen?outlook=connected`);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Outlook-Verbindung fehlgeschlagen.";
    return NextResponse.redirect(
      `${origin}/plattformen?outlook=error&message=${encodeURIComponent(message)}`
    );
  }
}
