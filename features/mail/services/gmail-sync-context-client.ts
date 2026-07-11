import {
  fetchOAuthConnections,
  migrateLegacyOAuthTokens,
} from "@/features/oauth/services/oauth-connections-client";
import type { GmailSyncContext } from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";

/** OAuth-Verbindung für Gmail-Sync auflösen (connectionId + ownEmail). */
export async function resolveGmailSyncContext(
  ownEmail?: string | null
): Promise<GmailSyncContext> {
  try {
    await migrateLegacyOAuthTokens();
  } catch {
    // Migration optional — Sync kann trotzdem mit provider_token laufen.
  }

  const connections = await fetchOAuthConnections("google");
  const primary = connections?.grouped.google[0];

  return {
    ownEmail: ownEmail ?? primary?.accountEmail ?? null,
    connectionId: primary?.id,
  };
}
