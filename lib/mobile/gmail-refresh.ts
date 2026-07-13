import { syncGmailViaOAuthApi } from "@/features/oauth/services/oauth-connections-client";
import { syncGmailVorgaengeFromOAuthAccounts } from "@/features/workspace/services/vorgaenge/gmail-oauth-sync";
import { loadGmailVorgaenge } from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import { resolveGmailSyncContext } from "@/features/mail/services/gmail-sync-context-client";
import { refreshOutlookConnectionStatus } from "@/features/outlook/services/outlook-auth-service";
import { loadOutlookVorgaenge } from "@/features/outlook/services/outlook-vorgaenge-store";
import { createClient } from "@/lib/supabase/client";

export type GmailRefreshResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

/** Gmail/Outlook-Sync für Pull-to-Refresh. */
export async function refreshMailVorgaenge(): Promise<GmailRefreshResult> {
  const supabase = createClient();
  if (!supabase) {
    return { ok: false, message: "Keine Verbindung." };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.provider_token ?? null;
  if (token) {
    const gmailContext = await resolveGmailSyncContext(session?.user?.email ?? null);
    await loadGmailVorgaenge(token, gmailContext);
  }

  try {
    const payload = await syncGmailViaOAuthApi();
    if (payload.accounts.length > 0) {
      await syncGmailVorgaengeFromOAuthAccounts(payload.accounts);
    }
  } catch {
    // OAuth optional
  }

  const outlookStatus = await refreshOutlookConnectionStatus();
  if (outlookStatus.status === "connected") {
    await loadOutlookVorgaenge();
  }

  return { ok: true, message: "Vorgänge aktualisiert." };
}
