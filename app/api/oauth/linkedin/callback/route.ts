import { NextResponse } from "next/server";
import {
  exchangeLinkedInAuthCode,
  fetchLinkedInOrganizations,
} from "@/lib/oauth/linkedin-oauth-server";
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
      buildSocialOAuthReturnUrl(origin, "linkedin", "error", oauthError)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      buildSocialOAuthReturnUrl(origin, "linkedin", "error", "OAuth-Parameter fehlen.")
    );
  }

  const startState = await consumeSocialOAuthStartState(state);
  if (!startState) {
    return NextResponse.redirect(
      buildSocialOAuthReturnUrl(origin, "linkedin", "error", "OAuth-Status ungültig.")
    );
  }

  const tokenResult = await exchangeLinkedInAuthCode(code);
  if (!tokenResult) {
    return NextResponse.redirect(
      buildSocialOAuthReturnUrl(
        origin,
        "linkedin",
        "error",
        "LinkedIn Token-Austausch fehlgeschlagen.",
        startState.returnTo
      )
    );
  }

  const orgs = await fetchLinkedInOrganizations(tokenResult.accessToken);
  const org =
    orgs.find((item) => item.id === process.env.LINKEDIN_ORGANIZATION_ID?.trim()) ??
    orgs[0] ??
    null;

  const orgId = org?.id ?? process.env.LINKEDIN_ORGANIZATION_ID?.trim() ?? null;
  if (!orgId) {
    return NextResponse.redirect(
      buildSocialOAuthReturnUrl(
        origin,
        "linkedin",
        "error",
        "Keine LinkedIn-Organisation gefunden.",
        startState.returnTo
      )
    );
  }

  const expiresAt =
    tokenResult.expiresIn != null
      ? new Date(Date.now() + tokenResult.expiresIn * 1000).toISOString()
      : null;

  await upsertSocialConnection({
    companyId: startState.companyId,
    platform: "linkedin",
    accessToken: tokenResult.accessToken,
    tokenExpiresAt: expiresAt,
    linkedinOrgId: orgId,
    pageName: org?.name ?? `Organisation ${orgId}`,
  });

  return NextResponse.redirect(
    buildSocialOAuthReturnUrl(
      origin,
      "linkedin",
      "connected",
      undefined,
      startState.returnTo
    )
  );
}
