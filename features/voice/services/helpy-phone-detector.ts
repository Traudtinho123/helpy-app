import type { VoiceCallClassification } from "@/features/voice/types/voice-types";
import { VOICE_CALL_CLASSIFICATION_LABELS } from "@/features/voice/types/voice-types";
import type {
  VorgangPriority,
  VorgangTyp,
} from "@/features/workspace/services/vorgaenge/types";

export const HELPY_PHONE_QUELLE = "helpy_phone";
export const HELPY_PHONE_QUELLE_LABEL = "HELPY Phone";

export function isHelpyPhoneVorgang(source: {
  typ?: string;
  quelle?: string;
  id?: string;
}): boolean {
  return isHelpyPhoneSource(source);
}

/** Telefon-Vorgang, der im HELPY-Phone-Archiv (Tab) erscheint — nur erledigte. */
export function isHelpyPhoneArchiveVorgang(source: {
  typ?: string;
  quelle?: string;
  id?: string;
  status?: string;
}): boolean {
  if (!isHelpyPhoneSource(source)) return false;
  return source.status === "erledigt";
}

export function isHelpyPhoneSource(source: {
  typ?: string;
  quelle?: string;
  id?: string;
}): boolean {
  return (
    source.typ === "helpy_phone" ||
    source.quelle === HELPY_PHONE_QUELLE ||
    source.quelle === "Telefon" ||
    Boolean(source.id?.startsWith("voice-"))
  );
}

export function mapVoiceClassificationToPriority(
  classification: VoiceCallClassification | undefined | null
): VorgangPriority {
  switch (classification) {
    case "notfall":
      return "kritisch";
    case "besichtigung_anfrage":
    case "rueckruf_wunsch":
      return "hoch";
    case "info_anfrage":
      return "niedrig";
    default:
      return "mittel";
  }
}

export function mapVoiceClassificationToHelpyPhoneTyp(
  classification: VoiceCallClassification | undefined | null
): VorgangTyp {
  if (classification === "besichtigung_anfrage") {
    return "terminwunsch";
  }
  if (classification === "rueckruf_wunsch" || classification === "notfall") {
    return "rueckruf";
  }
  return "anfrage";
}

export function buildHelpyPhoneVorgangTitle(input: {
  classification?: VoiceCallClassification | null;
  summary?: string | null;
  autoCreated?: boolean;
}): string {
  const intentLabel = input.classification
    ? VOICE_CALL_CLASSIFICATION_LABELS[input.classification]
    : "Telefonanruf";

  return `📞 ${intentLabel} - Telefonanruf`;
}

export function buildHelpyPhoneVorgangContent(input: {
  summary?: string | null;
  transcript?: string | null;
  callId?: string | null;
  callerPhone?: string | null;
  appointmentDetails?: string[];
}): string {
  const lines = [
    input.callerPhone?.trim() ? `Anrufer: ${input.callerPhone.trim()}` : null,
    input.summary?.trim() ? `Zusammenfassung:\n${input.summary.trim()}` : null,
    ...(input.appointmentDetails ?? []),
    input.transcript?.trim()
      ? `Transkript:\n${input.transcript.trim().slice(0, 1200)}`
      : null,
    input.callId ? `Anruf-ID: ${input.callId}` : null,
  ].filter(Boolean);

  return lines.join("\n\n");
}
