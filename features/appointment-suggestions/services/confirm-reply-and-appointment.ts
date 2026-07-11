import {
  confirmAppointmentSuggestion,
  getAppointmentSuggestion,
  selectAppointmentSlot,
} from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import { sendPreparedReplyDraft } from "@/features/reply-drafts/services/send-reply-draft";
import { getReplyDraft } from "@/features/reply-drafts/services/reply-draft-engine";
import type { HelpyReview } from "@/features/review/services/types";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

export const VIEWING_COMBINED_ACTION_LABEL =
  "Antwort senden & Termin bestätigen";

export function createReviewForReplyAndAppointment(
  vorgang: Vorgang
): HelpyReview | null {
  const draft = getReplyDraft(vorgang.id);
  const suggestion = getAppointmentSuggestion(vorgang.id);
  if (!draft || !suggestion) return null;

  const selected =
    suggestion.slots.find((slot) => slot.id === suggestion.selectedSlotId) ??
    suggestion.slots[0];

  if (!selected) return null;

  if (suggestion.selectedSlotId !== selected.id) {
    selectAppointmentSlot(vorgang.id, selected.id);
  }

  return {
    id: `review-reply-appointment-${vorgang.id}`,
    instanceId: `${draft.id}-${selected.id}`,
    actionTypeId: "antwort-vorbereiten",
    actionTitle: VIEWING_COMBINED_ACTION_LABEL,
    title: "Antwort & Termin prüfen",
    helpyHint:
      "Nach Bestätigung wird die Antwort gesendet und der Termin im Kalender angelegt.",
    content: {
      kind: "antwort",
      betreff: draft.subject,
      empfaenger: draft.recipient,
      tonalitaet: draft.tone,
      antworttext: `${draft.draftText}\n\n———\nTermin: ${selected.dateLabel}, ${selected.start}–${selected.end}`,
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

  if (!suggestion.selectedSlotId && suggestion.slots[0]) {
    selectAppointmentSlot(vorgang.id, suggestion.slots[0].id);
  }

  if (!getAppointmentSuggestion(vorgang.id)?.selectedSlotId) {
    return { ok: false, error: "Bitte wähle zuerst einen Terminvorschlag." };
  }

  const sendResult = await sendPreparedReplyDraft(vorgang);
  if (!sendResult.ok) {
    return sendResult;
  }

  const appointmentResult = await confirmAppointmentSuggestion(vorgang.id);
  if (!appointmentResult.ok) {
    return {
      ok: false,
      error: `Antwort wurde gesendet, aber der Termin konnte nicht angelegt werden: ${appointmentResult.error}`,
    };
  }

  return {
    ok: true,
    message: "Antwort gesendet und Termin im Kalender bestätigt.",
  };
}
