import {
  getMicrosoftOAuthConfig,
  isMicrosoftConfigured,
} from "@/features/calendar/services/microsoft/types";
import { OUTLOOK_CONNECT_SCOPES } from "@/features/outlook/types/outlook-types";
import type { OAuthStoredTokens } from "@/lib/oauth/types";

export function isMicrosoftOAuthConfigured(): boolean {
  const config = getMicrosoftOAuthConfig();
  return isMicrosoftConfigured() && Boolean(config.clientSecret);
}

export function getMicrosoftOAuthRedirectUri(): string {
  if (process.env.MICROSOFT_OAUTH_REDIRECT_URI) {
    return process.env.MICROSOFT_OAUTH_REDIRECT_URI;
  }
  if (process.env.MICROSOFT_OUTLOOK_REDIRECT_URI) {
    return process.env.MICROSOFT_OUTLOOK_REDIRECT_URI;
  }
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return `${base}/api/oauth/microsoft/callback`;
}

export function buildMicrosoftOAuthStartUrl(state: string): string {
  const config = getMicrosoftOAuthConfig();
  const redirectUri = getMicrosoftOAuthRedirectUri();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: OUTLOOK_CONNECT_SCOPES.join(" "),
    response_mode: "query",
    state,
    prompt: "consent",
  });

  return `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function exchangeMicrosoftAuthCode(
  code: string
): Promise<OAuthStoredTokens> {
  const config = getMicrosoftOAuthConfig();
  const redirectUri = getMicrosoftOAuthRedirectUri();

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret ?? "",
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    scope: OUTLOOK_CONNECT_SCOPES.join(" "),
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || "Microsoft OAuth Token-Austausch fehlgeschlagen.");
  }

  const payload = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };

  const profile = await fetchMicrosoftProfile(payload.access_token);

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    accountEmail: profile.email ?? "unknown@outlook.com",
    expiresAt:
      typeof payload.expires_in === "number"
        ? Date.now() + payload.expires_in * 1000
        : null,
    scopes: payload.scope?.split(" ") ?? [...OUTLOOK_CONNECT_SCOPES],
  };
}

export async function refreshMicrosoftAccessToken(
  refreshToken: string,
  currentEmail: string
): Promise<OAuthStoredTokens> {
  const config = getMicrosoftOAuthConfig();
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret ?? "",
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    scope: OUTLOOK_CONNECT_SCOPES.join(" "),
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Microsoft Refresh Token ungültig.");
  }

  const payload = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? refreshToken,
    accountEmail: currentEmail,
    expiresAt:
      typeof payload.expires_in === "number"
        ? Date.now() + payload.expires_in * 1000
        : null,
    scopes: payload.scope?.split(" ") ?? [...OUTLOOK_CONNECT_SCOPES],
  };
}

async function fetchMicrosoftProfile(
  accessToken: string
): Promise<{ email: string | null }> {
  const response = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) return { email: null };

  const profile = (await response.json()) as {
    mail?: string;
    userPrincipalName?: string;
  };

  return {
    email: profile.mail ?? profile.userPrincipalName ?? null,
  };
}

export type OutlookStoredTokens = {
  accessToken: string;
  refreshToken: string | null;
  accountEmail: string | null;
  expiresAt: number | null;
};

export function toOutlookStoredTokens(
  tokens: OAuthStoredTokens
): OutlookStoredTokens {
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accountEmail: tokens.accountEmail,
    expiresAt: tokens.expiresAt,
  };
}
