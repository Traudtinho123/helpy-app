import type { VoiceCallClassification } from "@/features/voice/types/voice-types";
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
      return "mittel";
    default:
      return "mittel";
  }
}

export function mapVoiceClassificationToHelpyPhoneTyp(
  classification: VoiceCallClassification | undefined | null
): VorgangTyp {
  return "helpy_phone";
}

export function buildHelpyPhoneVorgangTitle(input: {
  classification?: VoiceCallClassification | null;
  summary?: string | null;
  autoCreated?: boolean;
}): string {
  if (input.autoCreated && input.classification === "besichtigung_anfrage") {
    return "📞 Besichtigungsanfrage via Telefon";
  }

  const summarySnippet = input.summary?.trim().slice(0, 60);
  if (summarySnippet) {
    return `📞 Telefonanruf - ${summarySnippet}${(input.summary?.length ?? 0) > 60 ? "…" : ""}`;
  }

  return "📞 Telefonanruf";
}

export function buildHelpyPhoneVorgangContent(input: {
  summary?: string | null;
  transcript?: string | null;
  callId?: string | null;
  appointmentDetails?: string[];
}): string {
  const lines = [
    input.summary?.trim() ? `Zusammenfassung:\n${input.summary.trim()}` : null,
    ...(input.appointmentDetails ?? []),
    input.transcript?.trim()
      ? `Transkript:\n${input.transcript.trim().slice(0, 1200)}`
      : null,
    input.callId ? `Anruf-ID: ${input.callId}` : null,
  ].filter(Boolean);

  return lines.join("\n\n");
}
