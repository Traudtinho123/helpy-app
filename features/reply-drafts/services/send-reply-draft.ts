import { recordCrmGmailReplySent } from "@/features/crm/services/crm-sync";
import {
  GMAIL_SEND_ERROR_MESSAGE,
  GMAIL_SEND_SUCCESS_MESSAGE,
  sendGmailMessage,
} from "@/features/gmail/services/gmail-drafts";
import {
  isBlockedOwnEmailRecipient,
  RECIPIENT_UNKNOWN_MESSAGE,
} from "@/features/gmail/services/extract-email-address";
import { notifyGmailSent } from "@/features/notifications/services/notification-emitter";
import { processBackgroundMemoryEvent } from "@/features/memory/services/background-memory-engine";
import { peekRealEstateObjectByVorgangId } from "@/features/real-estate/object/object-memory";
import { startFollowUpFromGmailSend } from "@/features/followup/services/followup-engine";
import {
  OUTLOOK_SEND_ERROR_MESSAGE,
  OUTLOOK_SEND_SUCCESS_MESSAGE,
} from "@/features/outlook/services/outlook-drafts";
import { sendOutlookMessageFromApi } from "@/features/outlook/services/outlook-sync-service";
import { isOutlookVorgang } from "@/features/decision/services/decision-engine";
import {
  confirmReplyDraft,
  getReplyDraft,
} from "@/features/reply-drafts/services/reply-draft-engine";
import {
  recordGmailReplySent,
  recordReviewConfirmed,
} from "@/features/workspace/services/status";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import { createClient } from "@/lib/supabase/client";

export type SendReplyDraftResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

async function getSessionTokens(): Promise<{
  accessToken: string | null;
  ownEmail: string | null;
}> {
  const supabase = createClient();
  if (!supabase) return { accessToken: null, ownEmail: null };

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    accessToken: session?.provider_token ?? null,
    ownEmail: session?.user?.email ?? null,
  };
}

/** Sendet den vorbereiteten Antwortentwurf (Gmail oder Outlook). */
export async function sendPreparedReplyDraft(
  vorgang: Vorgang
): Promise<SendReplyDraftResult> {
  const draft = getReplyDraft(vorgang.id);
  if (!draft) {
    return { ok: false, error: "Kein Antwortentwurf vorhanden." };
  }

  const { accessToken, ownEmail } = await getSessionTokens();
  const isOutlook = isOutlookVorgang(vorgang);

  if (!draft.recipientValid || !draft.recipientEmail) {
    return { ok: false, error: RECIPIENT_UNKNOWN_MESSAGE };
  }

  if (
    isBlockedOwnEmailRecipient(
      draft.recipientEmail,
      ownEmail,
      draft.originalFrom
    )
  ) {
    return { ok: false, error: RECIPIENT_UNKNOWN_MESSAGE };
  }

  const result = isOutlook
    ? await sendOutlookMessageFromApi({
        to: draft.recipientEmail,
        subject: draft.subject,
        body: draft.draftText,
      })
    : await (async () => {
        if (!accessToken) {
          return {
            ok: false as const,
            error: isOutlook
              ? OUTLOOK_SEND_ERROR_MESSAGE
              : GMAIL_SEND_ERROR_MESSAGE,
          };
        }
        return sendGmailMessage({
          accessToken,
          to: draft.recipientEmail!,
          subject: draft.subject,
          body: draft.draftText,
          threadId: vorgang.threadId,
        });
      })();

  if (!result.ok) {
    return {
      ok: false,
      error: result.error || (isOutlook ? OUTLOOK_SEND_ERROR_MESSAGE : GMAIL_SEND_ERROR_MESSAGE),
    };
  }

  confirmReplyDraft(vorgang.id);
  recordReviewConfirmed(vorgang.id);
  recordGmailReplySent(vorgang.id);
  recordCrmGmailReplySent(vorgang.id, draft.subject);
  processBackgroundMemoryEvent({
    type: "antwort-gesendet",
    vorgangId: vorgang.id,
    email: draft.recipientEmail,
    text: draft.draftText,
    objectId: peekRealEstateObjectByVorgangId(vorgang.id)?.objectId ?? null,
  });
  startFollowUpFromGmailSend(vorgang);
  notifyGmailSent(vorgang);

  return {
    ok: true,
    message: isOutlook ? OUTLOOK_SEND_SUCCESS_MESSAGE : GMAIL_SEND_SUCCESS_MESSAGE,
  };
}
