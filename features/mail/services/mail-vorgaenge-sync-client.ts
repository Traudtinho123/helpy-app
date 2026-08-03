import { loadDbVorgaengeFromApi } from "@/features/vorgaenge/services/db-vorgaenge-store";
import { getAllMailVorgaenge } from "@/features/mail/unified-mail-source-service";
import { resolveGmailSyncContext } from "@/features/mail/services/gmail-sync-context-client";
import { syncGmailViaOAuthApi } from "@/features/oauth/services/oauth-connections-client";
import { ensureCompletedVorgaengeLoaded } from "@/features/workspace/services/vorgaenge/completed-vorgaenge-store";
import { loadGmailVorgaenge } from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import { syncGmailVorgaengeFromOAuthAccounts } from "@/features/workspace/services/vorgaenge/gmail-oauth-sync";
import { refreshOutlookConnectionStatus } from "@/features/outlook/services/outlook-auth-service";
import { loadOutlookVorgaenge } from "@/features/outlook/services/outlook-vorgaenge-store";
import type { Session } from "@supabase/supabase-js";

/** Lädt Gmail/Outlook/DB/Voice aus sessionStorage/localStorage in den Speicher. */
export function hydrateMailVorgaengeCaches(): void {
  getAllMailVorgaenge();
}

async function syncGmailAccounts(session: Session | null): Promise<boolean> {
  try {
    const payload = await syncGmailViaOAuthApi();
    if (payload.accounts.length > 0) {
      await syncGmailVorgaengeFromOAuthAccounts(payload.accounts);
      return true;
    }
  } catch {
    // OAuth-Sync optional — Fallback auf Session-Token unten.
  }

  const token = session?.provider_token;
  if (!token) return false;

  const gmailContext = await resolveGmailSyncContext(session?.user?.email ?? null);
  await loadGmailVorgaenge(token, gmailContext);
  return true;
}

async function syncOutlookAccounts(): Promise<boolean> {
  const outlookStatus = await refreshOutlookConnectionStatus();
  if (outlookStatus.status === "connected") {
    await loadOutlookVorgaenge();
    return true;
  }
  return false;
}

/** Hintergrund-Sync: ein Gmail-Pfad, parallele Nebenläufer. */
export async function syncMailVorgaengeSources(
  session: Session | null
): Promise<{ mailAttempted: boolean }> {
  const userId = session?.user?.id ?? null;
  let mailAttempted = false;

  await Promise.all([
    ensureCompletedVorgaengeLoaded(userId),
    loadDbVorgaengeFromApi(),
    syncGmailAccounts(session).then((attempted) => {
      if (attempted) mailAttempted = true;
    }),
    syncOutlookAccounts().then((attempted) => {
      if (attempted) mailAttempted = true;
    }),
  ]);

  return { mailAttempted };
}
