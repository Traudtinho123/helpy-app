import {
  getAppointmentSuggestion,
  markSlotsOfferedAfterReplySent,
} from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import { sendPreparedReplyDraft } from "@/features/reply-drafts/services/send-reply-draft";
import { getReplyDraft } from "@/features/reply-drafts/services/reply-draft-engine";
import type { HelpyReview } from "@/features/review/services/types";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

export const VIEWING_COMBINED_ACTION_LABEL = "Antwort senden";
export const VIEWING_REPLY_SENT_MESSAGE =
  "Antwort mit Terminvorschlägen gesendet. Wähle nun den Termin des Kunden.";

export function createReviewForReplyAndAppointment(
  vorgang: Vorgang
): HelpyReview | null {
  const draft = getReplyDraft(vorgang.id);
  const suggestion = getAppointmentSuggestion(vorgang.id);
  if (!draft || !suggestion) return null;

  const slotsPreview = suggestion.slots
    .map(
      (slot, index) =>
        `Option ${index + 1}: ${slot.dateLabel} · ${slot.start} Uhr`
    )
    .join("\n");

  return {
    id: `review-reply-appointment-${vorgang.id}`,
    instanceId: draft.id,
    actionTypeId: "antwort-vorbereiten",
    actionTitle: VIEWING_COMBINED_ACTION_LABEL,
    title: "Antwort mit Terminvorschlägen prüfen",
    helpyHint:
      "Nach Bestätigung wird die Antwort mit den 3 konkreten Terminvorschlägen gesendet.",
    content: {
      kind: "antwort",
      betreff: draft.subject,
      empfaenger: draft.recipient,
      tonalitaet: draft.tone,
      antworttext: `${draft.draftText}\n\n———\nAngebotene Termine:\n${slotsPreview}`,
      primaryLabel: VIEWING_COMBINED_ACTION_LABEL,
      fehlendeAngaben: draft.missingInfo,
      anhaenge: draft.suggestedAttachments,
    },
  };
}

export async function confirmReplyAndAppointment(
  vorgang: Vorgang
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const suggestion = getAppointmentSuggestion(vorgang.id);

  if (!suggestion || suggestion.slots.length === 0) {
    return { ok: false, error: "Keine Terminvorschläge verfügbar." };
  }

  const sendResult = await sendPreparedReplyDraft(vorgang);
  if (!sendResult.ok) {
    return sendResult;
  }

  markSlotsOfferedAfterReplySent(vorgang.id);

  return {
    ok: true,
    message: VIEWING_REPLY_SENT_MESSAGE,
  };
}
