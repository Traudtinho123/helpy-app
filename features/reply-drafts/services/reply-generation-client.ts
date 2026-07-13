import type { AppointmentSlot } from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import {
  applyGeneratedReplyDraft,
  buildReplyDraftInputFromListe,
  setReplyDraftGenerationState,
} from "@/features/reply-drafts/services/reply-draft-engine";
import type { ReplyGenerationResult } from "@/features/reply-drafts/types/mail-analysis-types";
import type { ReplyDraftInput } from "@/features/reply-drafts/types/reply-draft-types";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";

export async function requestIntelligentReplyDraft(input: {
  vorgang: ListeVorgang;
  mailBody: string;
  appointmentSlots?: AppointmentSlot[];
}): Promise<ReplyGenerationResult | null> {
  const draftInput = buildReplyDraftInputFromListe(input.vorgang);

  setReplyDraftGenerationState(input.vorgang.id, "loading");

  try {
    const response = await fetch("/api/reply-drafts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draftInput: draftInput,
        mailBody: input.mailBody,
        appointmentSlots: input.appointmentSlots ?? [],
      } satisfies {
        draftInput: ReplyDraftInput;
        mailBody: string;
        appointmentSlots?: AppointmentSlot[];
      }),
    });

    if (!response.ok) {
      setReplyDraftGenerationState(input.vorgang.id, "error");
      return null;
    }

    const payload = (await response.json()) as {
      result?: ReplyGenerationResult;
    };

    if (!payload.result) {
      setReplyDraftGenerationState(input.vorgang.id, "error");
      return null;
    }

    applyGeneratedReplyDraft(input.vorgang.id, payload.result);
    return payload.result;
  } catch {
    setReplyDraftGenerationState(input.vorgang.id, "error");
    return null;
  }
}
