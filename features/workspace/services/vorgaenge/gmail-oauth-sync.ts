import type { GmailConnectorMessage } from "@/features/gmail/services/gmail/types";
import type { GmailSyncApiResponse } from "@/features/oauth/services/oauth-connections-client";
import { syncGmailVorgaengeIncremental } from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";

type OAuthGmailAccountPayload = GmailSyncApiResponse["accounts"][number];

/**
 * Verarbeitet serverseitig geladene Gmail-Nachrichten aller verbundenen Konten.
 * Tokens bleiben auf dem Server — der Client erhält nur Nachrichten-Metadaten.
 */
export async function syncGmailVorgaengeFromOAuthAccounts(
  accounts: OAuthGmailAccountPayload[]
): Promise<{ ok: boolean; newCount: number; error?: string }> {
  if (accounts.length === 0) {
    return { ok: false, newCount: 0, error: "Kein Gmail-Konto verbunden." };
  }

  let totalNew = 0;
  let lastError: string | undefined;

  for (const account of accounts) {
    const result = await syncGmailVorgaengeIncremental("", {
      ownEmail: account.accountEmail,
      connectionId: account.connectionId,
      prefetchedMessages: account.messages,
    });

    if (result.ok) {
      totalNew += result.newCount;
    } else if ("error" in result) {
      lastError = result.error;
    }
  }

  return {
    ok: totalNew > 0 || !lastError,
    newCount: totalNew,
    error: lastError,
  };
}

export type { GmailConnectorMessage };
