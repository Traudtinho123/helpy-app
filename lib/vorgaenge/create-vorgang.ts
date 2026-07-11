import { VOICE_CALL_CLASSIFICATION_LABELS } from "@/features/voice/types/voice-types";
import type { VoiceCallClassification } from "@/features/voice/types/voice-types";
import type {
  CreateVorgangInput,
  CreateVorgangResult,
} from "@/features/vorgaenge/types/create-vorgang-types";
import {
  findVorgangByGmailMessageId,
  findVorgangByVoiceCallId,
  insertVorgangRecord,
} from "@/lib/vorgaenge/vorgang-repository";

export async function createVorgang(
  input: CreateVorgangInput
): Promise<CreateVorgangResult> {
  if (!input.company_id?.trim()) {
    throw new Error("company_id fehlt.");
  }
  if (!input.titel?.trim()) {
    throw new Error("titel fehlt.");
  }
  if (!input.inhalt?.trim()) {
    throw new Error("inhalt fehlt.");
  }

  if (input.gmail_message_id?.trim()) {
    const existing = await findVorgangByGmailMessageId(
      input.company_id,
      input.gmail_message_id.trim()
    );
    if (existing) {
      return { id: existing.id, record: existing, created: false };
    }
  }

  if (input.voice_call_id?.trim()) {
    const existing = await findVorgangByVoiceCallId(input.voice_call_id.trim());
    if (existing) {
      return { id: existing.id, record: existing, created: false };
    }
  }

  const record = await insertVorgangRecord({
    ...input,
    titel: input.titel.trim(),
    inhalt: input.inhalt.trim(),
    gmail_message_id: input.gmail_message_id?.trim() || null,
    gmail_thread_id: input.gmail_thread_id?.trim() || null,
    voice_call_id: input.voice_call_id?.trim() || null,
    anrufer_nummer: input.anrufer_nummer?.trim() || null,
    termin_datum: input.termin_datum?.trim() || null,
    termin_uhrzeit: input.termin_uhrzeit?.trim() || null,
    whatsapp_message_id: input.whatsapp_message_id?.trim() || null,
  });

  return { id: record.id, record, created: true };
}

export function mapVoiceClassificationToCreatePriority(
  classification: VoiceCallClassification
): CreateVorgangInput["prioritaet"] {
  switch (classification) {
    case "notfall":
      return "kritisch";
    case "besichtigung_anfrage":
    case "rueckruf_wunsch":
      return "hoch";
    case "info_anfrage":
      return "normal";
    default:
      return "normal";
  }
}

export function buildHelpyPhoneVorgangCreateInput(input: {
  companyId: string;
  callId: string;
  classification: VoiceCallClassification;
  summary: string;
  callerNumber?: string | null;
  terminDatum?: string | null;
  terminUhrzeit?: string | null;
  kundenId?: string | null;
}): CreateVorgangInput {
  const intentLabel = VOICE_CALL_CLASSIFICATION_LABELS[input.classification];

  return {
    company_id: input.companyId,
    source: "helpy_phone",
    titel: `📞 ${intentLabel} - Telefonanruf`,
    inhalt: input.summary.trim(),
    prioritaet: mapVoiceClassificationToCreatePriority(input.classification),
    status: "neu",
    voice_call_id: input.callId,
    anrufer_nummer: input.callerNumber ?? null,
    termin_datum: input.terminDatum ?? null,
    termin_uhrzeit: input.terminUhrzeit ?? null,
    kunden_id: input.kundenId ?? null,
  };
}
