import type { VoiceIntentResult } from "@/features/voice/types/voice-types";

/** Erzeugt eine kurze Post-Call-Zusammenfassung aus Transkript + Intent. */
export function buildVoiceCallSummary(
  transcript: string,
  intent: VoiceIntentResult,
  callerName?: string | null
): string {
  const cleaned = transcript.replace(/\s+/g, " ").trim();
  const excerpt =
    cleaned.length > 160 ? `${cleaned.slice(0, 157).trim()}…` : cleaned;

  const who = callerName?.trim() ? `${callerName.trim()} — ` : "";
  const keywords =
    intent.detectedKeywords.length > 0
      ? ` (${intent.detectedKeywords.slice(0, 3).join(", ")})`
      : "";

  return `${who}${intent.intentLabel}${keywords}: ${excerpt || "Kein Transkript."}`;
}
