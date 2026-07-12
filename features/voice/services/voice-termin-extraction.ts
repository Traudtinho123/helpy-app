import { parseViewingTargetDate } from "@/features/appointment-suggestions/services/viewing-date-parser";
import { parseGermanTime, formatParsedTime } from "@/features/appointment-suggestions/services/viewing-time-parser";

export type ExtractedVoiceTermin = {
  terminDatum: string | null;
  terminUhrzeit: string | null;
};

function normalizeIsoDate(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return null;
  return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function normalizeTime(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Ergänzt fehlende Termin-Felder aus dem Transkript (Fallback nach GPT). */
export function extractVoiceTerminFromTranscript(
  transcript: string
): ExtractedVoiceTermin {
  const terminDatum = parseViewingTargetDate(transcript);
  const parsedTime = parseGermanTime(transcript);
  const terminUhrzeit = parsedTime ? formatParsedTime(parsedTime) : null;

  return {
    terminDatum: terminDatum ? normalizeIsoDate(terminDatum) : null,
    terminUhrzeit: normalizeTime(terminUhrzeit),
  };
}

export function mergeVoiceTerminFields(input: {
  terminDatum?: string | null;
  terminUhrzeit?: string | null;
  transcript: string;
}): ExtractedVoiceTermin {
  const fromTranscript = extractVoiceTerminFromTranscript(input.transcript);

  return {
    terminDatum:
      normalizeIsoDate(input.terminDatum) ?? fromTranscript.terminDatum,
    terminUhrzeit:
      normalizeTime(input.terminUhrzeit) ?? fromTranscript.terminUhrzeit,
  };
}
