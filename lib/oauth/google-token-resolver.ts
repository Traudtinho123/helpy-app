import { getSession } from "@/lib/auth/session";
import { GOOGLE_OAUTH_SCOPES } from "@/features/gmail/services/google/oauth";
import { upsertOAuthConnection } from "@/lib/oauth/connection-repository";
import {
  getValidOAuthTokens,
  listValidGoogleTokensForCompany,
} from "@/lib/oauth/token-service";
import type { OAuthAuthContext, OAuthStoredTokens } from "@/lib/oauth/types";

export type GoogleSessionTokenInput = {
  accessToken: string;
  refreshToken?: string | null;
  accountEmail?: string | null;
};

export function readGoogleTokensFromRequestHeaders(
  request: Request
): GoogleSessionTokenInput | null {
  const accessToken = request.headers.get("x-gmail-access-token")?.trim();
  if (!accessToken) return null;

  return {
    accessToken,
    refreshToken: request.headers.get("x-gmail-refresh-token"),
    accountEmail: request.headers.get("x-gmail-account-email"),
  };
}

function normalizeAccountEmail(
  email: string | null | undefined,
  context: OAuthAuthContext
): string {
  return (
    email?.trim().toLowerCase() ??
    context.userEmail?.trim().toLowerCase() ??
    "unknown@gmail.com"
  );
}

function toStoredTokens(
  input: GoogleSessionTokenInput,
  context: OAuthAuthContext
): OAuthStoredTokens {
  return {
    accessToken: input.accessToken,
    refreshToken: input.refreshToken ?? null,
    accountEmail: normalizeAccountEmail(input.accountEmail, context),
    expiresAt: null,
    scopes: [...GOOGLE_OAUTH_SCOPES],
  };
}

async function readServerSessionGoogleTokens(
  context: OAuthAuthContext
): Promise<GoogleSessionTokenInput | null> {
  const { session } = await getSession();
  if (!session?.provider_token) return null;

  return {
    accessToken: session.provider_token,
    refreshToken: session.provider_refresh_token ?? null,
    accountEmail: session.user?.email ?? context.userEmail,
  };
}

async function persistSessionGoogleTokens(
  context: OAuthAuthContext,
  tokens: OAuthStoredTokens
): Promise<Array<{ connectionId: string; tokens: OAuthStoredTokens }>> {
  const connection = await upsertOAuthConnection({
    companyId: context.companyId,
    userId: context.userId,
    provider: "google",
    tokens,
  });

  const valid = await getValidOAuthTokens(
    connection.id,
    context.companyId,
    "google"
  );
  if (!valid) return [];

  return [{ connectionId: connection.id, tokens: valid }];
}

/**
 * Lädt Gmail-Tokens aus oauth_connections; fällt auf Supabase-Session-Token zurück
 * (Login via Google) und persistiert diesen nach Möglichkeit in oauth_connections.
 */
export async function resolveGoogleMailAccounts(
  context: OAuthAuthContext,
  clientTokens?: GoogleSessionTokenInput | null
): Promise<Array<{ connectionId: string; tokens: OAuthStoredTokens }>> {
  const fromDb = await listValidGoogleTokensForCompany(context.companyId);
  if (fromDb.length > 0) return fromDb;

  const sessionInput =
    clientTokens?.accessToken != null
      ? clientTokens
      : await readServerSessionGoogleTokens(context);

  if (!sessionInput?.accessToken) return [];

  const tokens = toStoredTokens(sessionInput, context);

  try {
    const persisted = await persistSessionGoogleTokens(context, tokens);
    if (persisted.length > 0) return persisted;
  } catch (error) {
    console.warn(
      "[oauth] session google token persist failed:",
      error instanceof Error ? error.message : error
    );
  }

  return [{ connectionId: "session-fallback", tokens }];
}

export async function resolvePrimaryGoogleMailAccount(
  context: OAuthAuthContext,
  clientTokens?: GoogleSessionTokenInput | null
): Promise<{ connectionId: string; tokens: OAuthStoredTokens } | null> {
  const accounts = await resolveGoogleMailAccounts(context, clientTokens);
  return accounts[0] ?? null;
}
