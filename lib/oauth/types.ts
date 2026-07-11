/** Enterprise OAuth — Provider und sichere Metadaten (ohne Tokens). */

export type OAuthProviderId = "google" | "microsoft";

export type OAuthConnectionStatus = "active" | "error" | "revoked";

export type OAuthConnectionPublic = {
  id: string;
  companyId: string;
  provider: OAuthProviderId;
  accountEmail: string;
  status: OAuthConnectionStatus;
  connectedAt: string;
  lastSyncAt: string | null;
  lastError: string | null;
  connectedByUserId: string;
};

export type OAuthStoredTokens = {
  accessToken: string;
  refreshToken: string | null;
  accountEmail: string;
  expiresAt: number | null;
  scopes: string[];
};

export type OAuthAuthContext = {
  userId: string;
  companyId: string;
  userEmail: string | null;
};

export type OAuthStartState = {
  state: string;
  provider: OAuthProviderId;
  companyId: string;
  userId: string;
  returnTo: string;
};

/** Mail-Provider-ID im Unified-Mail-Core. */
export function oauthProviderToMailProvider(
  provider: OAuthProviderId
): "gmail" | "outlook" {
  return provider === "google" ? "gmail" : "outlook";
}

export function mailProviderToOAuthProvider(
  provider: "gmail" | "outlook"
): OAuthProviderId {
  return provider === "gmail" ? "google" : "microsoft";
}
