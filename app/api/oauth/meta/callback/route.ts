import { NextResponse } from "next/server";
import {
  exchangeMetaAuthCode,
  exchangeMetaLongLivedToken,
  fetchMetaPages,
} from "@/lib/oauth/meta-oauth-server";
import {
  buildSocialOAuthReturnUrl,
  consumeSocialOAuthStartState,
} from "@/lib/oauth/social-oauth-state-cookie";
import { upsertSocialConnection } from "@/lib/social-media/social-media-repository";

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error_description");

  if (oauthError) {
    return NextResponse.redirect(
      buildSocialOAuthReturnUrl(origin, "meta", "error", oauthError)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      buildSocialOAuthReturnUrl(origin, "meta", "error", "OAuth-Parameter fehlen.")
    );
  }

  const startState = await consumeSocialOAuthStartState(state);
  if (!startState) {
    return NextResponse.redirect(
      buildSocialOAuthReturnUrl(origin, "meta", "error", "OAuth-Status ungültig.")
    );
  }

  const shortToken = await exchangeMetaAuthCode(code);
  if (!shortToken) {
    return NextResponse.redirect(
      buildSocialOAuthReturnUrl(
        origin,
        "meta",
        "error",
        "Meta Token-Austausch fehlgeschlagen.",
        startState.returnTo
      )
    );
  }

  const longToken =
    (await exchangeMetaLongLivedToken(shortToken.accessToken)) ?? shortToken;

  const pages = await fetchMetaPages(longToken.accessToken);
  const page =
    pages.find((item) => item.instagramId) ??
    pages[0] ??
    null;

  if (!page) {
    return NextResponse.redirect(
      buildSocialOAuthReturnUrl(
        origin,
        "meta",
        "error",
        "Keine Facebook-Seite gefunden.",
        startState.returnTo
      )
    );
  }

  const expiresAt =
    longToken.expiresIn != null
      ? new Date(Date.now() + longToken.expiresIn * 1000).toISOString()
      : null;

  await upsertSocialConnection({
    companyId: startState.companyId,
    platform: "meta",
    accessToken: page.accessToken,
    tokenExpiresAt: expiresAt,
    pageId: page.id,
    pageName: page.name,
    instagramId: page.instagramId,
  });

  if (page.instagramId) {
    await upsertSocialConnection({
      companyId: startState.companyId,
      platform: "instagram",
      accessToken: page.accessToken,
      tokenExpiresAt: expiresAt,
      pageId: page.id,
      pageName: page.name,
      instagramId: page.instagramId,
    });
  }

  await upsertSocialConnection({
    companyId: startState.companyId,
    platform: "facebook",
    accessToken: page.accessToken,
    tokenExpiresAt: expiresAt,
    pageId: page.id,
    pageName: page.name,
    instagramId: page.instagramId,
  });

  return NextResponse.redirect(
    buildSocialOAuthReturnUrl(
      origin,
      "meta",
      "connected",
      undefined,
      startState.returnTo
    )
  );
}
