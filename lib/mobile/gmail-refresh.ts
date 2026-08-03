import {
  hydrateMailVorgaengeCaches,
  syncMailVorgaengeSources,
} from "@/features/mail/services/mail-vorgaenge-sync-client";
import { createClient } from "@/lib/supabase/client";

export type GmailRefreshResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

/** Gmail/Outlook-Sync für Pull-to-Refresh. */
export async function refreshMailVorgaenge(): Promise<GmailRefreshResult> {
  hydrateMailVorgaengeCaches();

  const supabase = createClient();
  if (!supabase) {
    return { ok: false, message: "Keine Verbindung." };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  await syncMailVorgaengeSources(session);

  return { ok: true, message: "Vorgänge aktualisiert." };
}
