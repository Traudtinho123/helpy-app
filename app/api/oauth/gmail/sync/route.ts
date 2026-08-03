import { NextResponse } from "next/server";
import { fetchRecentGmailMessages } from "@/features/gmail/services/gmail/connector";
import type { GmailConnectorMessage } from "@/features/gmail/services/gmail/types";
import { requireSkillAccessApi } from "@/lib/auth/require-skill-access";
import {
  resolveGoogleMailAccounts,
  requireOAuthContext,
  updateOAuthConnectionSyncMeta,
} from "@/lib/oauth";

export const dynamic = "force-dynamic";

export type GmailAccountSyncPayload = {
  connectionId: string;
  accountEmail: string;
  messages: GmailConnectorMessage[];
};

async function runGmailSync(): Promise<NextResponse> {
  const access = await requireSkillAccessApi();
  if (!access.ok) return access.response;

  const auth = await requireOAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let accounts: Awaited<ReturnType<typeof resolveGoogleMailAccounts>> = [];
  try {
    accounts = await resolveGoogleMailAccounts(auth.context);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Gmail-Verbindungen konnten nicht geladen werden.";
    console.error("[oauth/gmail/sync] token load:", message);
    return NextResponse.json({
      ok: false,
      error: message,
      accounts: [] as GmailAccountSyncPayload[],
    });
  }

  if (accounts.length === 0) {
    return NextResponse.json({
      ok: false,
      error: "Kein Gmail-Konto verbunden.",
      accounts: [] as GmailAccountSyncPayload[],
    });
  }

  const syncedAt = new Date().toISOString();
  const results: GmailAccountSyncPayload[] = [];
  const syncErrors: string[] = [];

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

      if (account.connectionId !== "session-fallback") {
        await updateOAuthConnectionSyncMeta(
          account.connectionId,
          auth.context.companyId,
          {
            lastSyncAt: syncedAt,
            lastError: null,
            status: "active",
          }
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gmail-Sync fehlgeschlagen.";
      syncErrors.push(`${account.tokens.accountEmail}: ${message}`);

      if (account.connectionId !== "session-fallback") {
        await updateOAuthConnectionSyncMeta(
          account.connectionId,
          auth.context.companyId,
          {
            lastError: message,
            status: "error",
          }
        );
      }
    }
  }

  return NextResponse.json({
    ok: results.length > 0,
    syncedAt,
    accounts: results,
    errors: syncErrors.length > 0 ? syncErrors : undefined,
  });
}

export async function POST(): Promise<NextResponse> {
  try {
    return await runGmailSync();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gmail-Sync fehlgeschlagen.";
    console.error("[oauth/gmail/sync]", message);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        accounts: [] as GmailAccountSyncPayload[],
      },
      { status: 500 }
    );
  }
}

/** Legacy-Clients riefen teils GET auf — gleiches Verhalten wie POST. */
export async function GET(): Promise<NextResponse> {
  return POST();
}
