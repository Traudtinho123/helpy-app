import { getGoogleConfig, isGoogleConfigured } from "@/features/gmail/services/google/config";
import { GOOGLE_OAUTH_SCOPES } from "@/features/gmail/services/google/oauth";
import type { OAuthStoredTokens } from "@/lib/oauth/types";

export function isGoogleOAuthConfigured(): boolean {
  const config = getGoogleConfig();
  return isGoogleConfigured() && Boolean(config.clientSecret);
}

export function getGoogleOAuthRedirectUri(): string {
  if (process.env.GOOGLE_OAUTH_REDIRECT_URI) {
    return process.env.GOOGLE_OAUTH_REDIRECT_URI;
  }
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return `${base}/api/oauth/google/callback`;
}

export function buildGoogleOAuthStartUrl(state: string): string {
  const config = getGoogleConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: getGoogleOAuthRedirectUri(),
    response_type: "code",
    scope: GOOGLE_OAUTH_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleAuthCode(code: string): Promise<OAuthStoredTokens> {
  const config = getGoogleConfig();
  const redirectUri = getGoogleOAuthRedirectUri();

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret ?? "",
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || "Google OAuth Token-Austausch fehlgeschlagen.");
  }

  const payload = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };

  const profile = await fetchGoogleUserEmail(payload.access_token);
  const expiresAt =
    typeof payload.expires_in === "number"
      ? Date.now() + payload.expires_in * 1000
      : null;

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    accountEmail: profile.email ?? "unknown@gmail.com",
    expiresAt,
    scopes: payload.scope?.split(" ") ?? [...GOOGLE_OAUTH_SCOPES],
  };
}

export async function refreshGoogleAccessToken(
  refreshToken: string,
  currentEmail: string
): Promise<OAuthStoredTokens> {
  const config = getGoogleConfig();
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret ?? "",
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Google Refresh Token ungültig.");
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
    scopes: payload.scope?.split(" ") ?? [...GOOGLE_OAUTH_SCOPES],
  };
}

async function fetchGoogleUserEmail(
  accessToken: string
): Promise<{ email: string | null }> {
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );

  if (!response.ok) return { email: null };
  const profile = (await response.json()) as { email?: string };
  return { email: profile.email ?? null };
}
