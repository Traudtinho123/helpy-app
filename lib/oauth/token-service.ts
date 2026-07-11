import {
  getOAuthConnectionTokens,
  getOAuthConnectionsWithTokens,
  updateOAuthConnectionTokens,
} from "@/lib/oauth/connection-repository";
import {
  refreshGoogleAccessToken,
} from "@/lib/oauth/google-oauth-server";
import {
  refreshMicrosoftAccessToken,
  type OutlookStoredTokens,
  toOutlookStoredTokens,
} from "@/lib/oauth/microsoft-oauth-server";
import type { OAuthProviderId, OAuthStoredTokens } from "@/lib/oauth/types";

const TOKEN_REFRESH_BUFFER_MS = 60_000;

export async function getValidOAuthTokens(
  connectionId: string,
  companyId: string,
  provider: OAuthProviderId
): Promise<OAuthStoredTokens | null> {
  const tokens = await getOAuthConnectionTokens(connectionId, companyId);
  if (!tokens) return null;

  const expiresSoon =
    tokens.expiresAt != null &&
    tokens.expiresAt - Date.now() < TOKEN_REFRESH_BUFFER_MS;

  if (!expiresSoon) return tokens;
  if (!tokens.refreshToken) return tokens;

  try {
    const refreshed =
      provider === "google"
        ? await refreshGoogleAccessToken(
            tokens.refreshToken,
            tokens.accountEmail
          )
        : await refreshMicrosoftAccessToken(
            tokens.refreshToken,
            tokens.accountEmail
          );

    await updateOAuthConnectionTokens(connectionId, companyId, refreshed);
    return refreshed;
  } catch (error) {
    console.error("[oauth] token refresh failed:", error);
    return tokens;
  }
}

export async function getValidOutlookTokensForCompany(
  companyId: string,
  connectionId?: string
): Promise<{ connectionId: string; tokens: OutlookStoredTokens } | null> {
  if (connectionId) {
    const tokens = await getValidOAuthTokens(
      connectionId,
      companyId,
      "microsoft"
    );
    if (!tokens) return null;
    return { connectionId, tokens: toOutlookStoredTokens(tokens) };
  }

  const connections = await getOAuthConnectionsWithTokens(
    companyId,
    "microsoft"
  );
  const first = connections[0];
  if (!first) return null;

  const valid = await getValidOAuthTokens(
    first.connection.id,
    companyId,
    "microsoft"
  );
  if (!valid) return null;

  return {
    connectionId: first.connection.id,
    tokens: toOutlookStoredTokens(valid),
  };
}

export async function getValidGoogleTokensForCompany(
  companyId: string,
  connectionId?: string
): Promise<{ connectionId: string; tokens: OAuthStoredTokens } | null> {
  if (connectionId) {
    const tokens = await getValidOAuthTokens(
      connectionId,
      companyId,
      "google"
    );
    if (!tokens) return null;
    return { connectionId, tokens };
  }

  const connections = await getOAuthConnectionsWithTokens(companyId, "google");
  const first = connections[0];
  if (!first) return null;

  const valid = await getValidOAuthTokens(
    first.connection.id,
    companyId,
    "google"
  );
  if (!valid) return null;

  return { connectionId: first.connection.id, tokens: valid };
}

export async function listValidGoogleTokensForCompany(
  companyId: string
): Promise<Array<{ connectionId: string; tokens: OAuthStoredTokens }>> {
  const connections = await getOAuthConnectionsWithTokens(companyId, "google");
  const resolved: Array<{ connectionId: string; tokens: OAuthStoredTokens }> = [];

  for (const entry of connections) {
    const valid = await getValidOAuthTokens(
      entry.connection.id,
      companyId,
      "google"
    );
    if (valid) {
      resolved.push({ connectionId: entry.connection.id, tokens: valid });
    }
  }

  return resolved;
}

export async function listValidOutlookTokensForCompany(
  companyId: string
): Promise<Array<{ connectionId: string; tokens: OutlookStoredTokens }>> {
  const connections = await getOAuthConnectionsWithTokens(
    companyId,
    "microsoft"
  );
  const resolved: Array<{ connectionId: string; tokens: OutlookStoredTokens }> =
    [];

  for (const entry of connections) {
    const valid = await getValidOAuthTokens(
      entry.connection.id,
      companyId,
      "microsoft"
    );
    if (valid) {
      resolved.push({
        connectionId: entry.connection.id,
        tokens: toOutlookStoredTokens(valid),
      });
    }
  }

  return resolved;
}

/** Gmail-Verbindung für einen Nutzer (Cron/Wochenbericht). */
export async function getValidGoogleTokensForUser(
  companyId: string,
  userId: string,
  preferredEmail?: string | null
): Promise<{ connectionId: string; tokens: OAuthStoredTokens } | null> {
  const connections = await getOAuthConnectionsWithTokens(companyId, "google");
  if (connections.length === 0) return null;

  const normalizedPreferred = preferredEmail?.trim().toLowerCase() ?? null;

  const ordered = [...connections].sort((a, b) => {
    const score = (entry: (typeof connections)[number]) => {
      if (entry.connection.connectedByUserId === userId) return 0;
      if (
        normalizedPreferred &&
        entry.connection.accountEmail.toLowerCase() === normalizedPreferred
      ) {
        return 1;
      }
      return 2;
    };
    return score(a) - score(b);
  });

  for (const entry of ordered) {
    const valid = await getValidOAuthTokens(
      entry.connection.id,
      companyId,
      "google"
    );
    if (valid) {
      return { connectionId: entry.connection.id, tokens: valid };
    }
  }

  return null;
}
