import { NextResponse } from "next/server";
import { fetchRecentGmailMessages } from "@/features/gmail/services/gmail/connector";
import type { GmailConnectorMessage } from "@/features/gmail/services/gmail/types";
import { requireSkillAccessApi } from "@/lib/auth/require-skill-access";
import { getSession } from "@/lib/auth/session";
import { GOOGLE_OAUTH_SCOPES } from "@/features/gmail/services/google/oauth";
import {
  listValidGoogleTokensForCompany,
  requireOAuthContext,
  updateOAuthConnectionSyncMeta,
  upsertOAuthConnection,
} from "@/lib/oauth";

export type GmailAccountSyncPayload = {
  connectionId: string;
  accountEmail: string;
  messages: GmailConnectorMessage[];
};

export async function POST(): Promise<NextResponse> {
  const access = await requireSkillAccessApi();
  if (!access.ok) return access.response;

  const auth = await requireOAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  await migrateSessionGoogleToken(auth.context);

  const accounts = await listValidGoogleTokensForCompany(auth.context.companyId);

  if (accounts.length === 0) {
    return NextResponse.json({
      ok: false,
      error: "Kein Gmail-Konto verbunden.",
      accounts: [] as GmailAccountSyncPayload[],
    });
  }

  const syncedAt = new Date().toISOString();
  const results: GmailAccountSyncPayload[] = [];

  for (const account of accounts) {
    try {
      const messages = await fetchRecentGmailMessages(
        account.tokens.accessToken,
        50,
        { ownEmail: account.tokens.accountEmail }
      );
      results.push({
        connectionId: account.connectionId,
        accountEmail: account.tokens.accountEmail,
        messages,
      });
      await updateOAuthConnectionSyncMeta(account.connectionId, auth.context.companyId, {
        lastSyncAt: syncedAt,
        lastError: null,
        status: "active",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gmail-Sync fehlgeschlagen.";
      await updateOAuthConnectionSyncMeta(account.connectionId, auth.context.companyId, {
        lastError: message,
        status: "error",
      });
    }
  }

  return NextResponse.json({
    ok: results.length > 0,
    syncedAt,
    accounts: results,
  });
}

/** Migriert legacy Supabase provider_token in oauth_connections (einmalig). */
async function migrateSessionGoogleToken(
  context: { userId: string; companyId: string; userEmail: string | null }
): Promise<void> {
  const { session } = await getSession();
  const providerToken = session?.provider_token;
  const providerRefresh = session?.provider_refresh_token;
  if (!providerToken) return;

  const email =
    session?.user?.email?.trim().toLowerCase() ??
    context.userEmail?.trim().toLowerCase() ??
    "unknown@gmail.com";

  await upsertOAuthConnection({
    companyId: context.companyId,
    userId: context.userId,
    provider: "google",
    tokens: {
      accessToken: providerToken,
      refreshToken: providerRefresh ?? null,
      accountEmail: email,
      expiresAt: null,
      scopes: [...GOOGLE_OAUTH_SCOPES],
    },
  });
}
