/** Google OAuth Scopes für HELPY — Lesen, Entwürfe, Kalender (kein Senden). */
export const GOOGLE_OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/calendar.events",
] as const;

/** Gmail-spezifische Scopes für HELPY Connect. */
export const GOOGLE_GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
] as const;

export function getGoogleOAuthScopeString(): string {
  return GOOGLE_OAUTH_SCOPES.join(" ");
}

export function buildGoogleAuthUrl(config: {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
