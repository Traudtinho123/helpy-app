/** Öffentliche App-Basis-URL für Redirects, OAuth und E-Mail-Links. */
export function resolvePublicAppOrigin(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "");

  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
}

/** Redirect-Ziel nach Supabase Auth — nicht die Google redirect_uri. */
export function resolveAuthCallbackUrl(): string {
  return `${resolvePublicAppOrigin()}/auth/callback`;
}

/** redirect_uri für direkten Google OAuth (Gmail/Kalender-Verbindung). */
export function resolveGoogleOAuthRedirectUri(): string {
  if (process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim()) {
    return process.env.GOOGLE_OAUTH_REDIRECT_URI.trim().replace(/\/$/, "");
  }

  return `${resolvePublicAppOrigin()}/api/oauth/google/callback`;
}

/** redirect_uri die Google bei Supabase-Login erhält (Google Cloud Console). */
export function resolveSupabaseGoogleOAuthRedirectUri(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()?.replace(/\/$/, "");
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/auth/v1/callback`;
}
