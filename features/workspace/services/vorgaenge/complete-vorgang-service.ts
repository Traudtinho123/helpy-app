import { markGmailMessagesAsRead } from "@/features/gmail/services/gmail/mark-message-read";
import { markOutlookMessageReadFromApi } from "@/features/outlook/services/outlook-sync-service";
import { markVorgangErledigtInOutlookStore } from "@/features/outlook/services/outlook-vorgaenge-store";
import { resolveMailProviderFromVorgang } from "@/features/mail/mail-brain-adapter";
import { registerCompletedVorgangPersistent } from "@/features/workspace/services/vorgaenge/completed-vorgaenge-store";
import { markVorgangErledigtInStore } from "@/features/workspace/services/vorgaenge/gmail-vorgaenge-store";
import { recordVorgangErledigt } from "@/features/workspace/services/status";
import { invalidateVorgaengeSummaryCaches } from "@/features/workspace/services/vorgaenge/vorgaenge-summary";
import { processBackgroundMemoryEvent } from "@/features/memory/services/background-memory-engine";
import { peekRealEstateObjectByVorgangId } from "@/features/real-estate/object/object-memory";
import { createClient } from "@/lib/supabase/client";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

export type CompleteVorgangResult = {
  ok: true;
  message: string;
  helpyPanelMessage: string;
  gmailUpdated: boolean;
};

export type CompleteVorgangError = {
  ok: false;
  message: string;
};

export const VORGANG_ERLEDIGT_SUCCESS = "Vorgang als erledigt markiert.";
export const VORGANG_ERLEDIGT_PANEL_MESSAGE =
  "Alles klar, ich habe den Vorgang als erledigt markiert.";
export const VORGANG_ERLEDIGT_MAIL_PARTIAL =
  "Vorgang wurde in HELPY erledigt markiert, aber die E-Mail konnte nicht als gelesen markiert werden.";

/** Markiert einen Vorgang als erledigt — ohne Löschen oder Archivieren. */
export async function completeVorgang(
  vorgang: Vorgang,
  accessToken?: string | null
): Promise<CompleteVorgangResult | CompleteVorgangError> {
  const supabase = createClient();
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const completedByUserId = session?.user?.id ?? null;

  recordVorgangErledigt(vorgang.id);
  const provider = resolveMailProviderFromVorgang(vorgang);
  if (provider === "outlook") {
    markVorgangErledigtInOutlookStore(vorgang.id);
  } else {
    markVorgangErledigtInStore(vorgang.id);
  }
  await registerCompletedVorgangPersistent(vorgang, completedByUserId);
  invalidateVorgaengeSummaryCaches();

  const emailMatch = vorgang.from?.match(/<([^>]+)>/);
  const email =
    emailMatch?.[1]?.trim() ??
    (vorgang.from?.includes("@") ? vorgang.from.trim() : undefined);

  processBackgroundMemoryEvent({
    type: "vorgang-erledigt",
    vorgangId: vorgang.id,
    email: email ?? null,
    objectId: peekRealEstateObjectByVorgangId(vorgang.id)?.objectId ?? null,
  });

  const messageIds = [
    vorgang.sourceEventId,
    vorgang.id.startsWith("brain-v3-outlook-")
      ? vorgang.id.replace("brain-v3-outlook-", "")
      : vorgang.id.startsWith("brain-v3-")
        ? vorgang.id.replace("brain-v3-", "")
        : undefined,
  ].filter((id): id is string => Boolean(id));

  let mailUpdated = false;

  if (provider === "outlook" && messageIds.length > 0) {
    const result = await markOutlookMessageReadFromApi(messageIds[0]);
    mailUpdated = result.ok;
  } else {
    const token = accessToken ?? session?.provider_token ?? null;
    if (token && messageIds.length > 0) {
      const result = await markGmailMessagesAsRead(token, messageIds);
      mailUpdated = result.ok.length > 0;
    }
  }

  if (messageIds.length > 0 && !mailUpdated) {
    return {
      ok: true,
      message: VORGANG_ERLEDIGT_MAIL_PARTIAL,
      helpyPanelMessage: VORGANG_ERLEDIGT_MAIL_PARTIAL,
      gmailUpdated: false,
    };
  }

  return {
    ok: true,
    message: VORGANG_ERLEDIGT_SUCCESS,
    helpyPanelMessage: VORGANG_ERLEDIGT_PANEL_MESSAGE,
    gmailUpdated: mailUpdated,
  };
}
