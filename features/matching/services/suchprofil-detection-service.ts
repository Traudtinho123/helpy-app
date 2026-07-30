import type { Kundenakte } from "@/features/kundenakte/types/kundenakte-types";
import {
  getSuchprofilForKunde,
  queueSuchprofilExtraction,
} from "@/features/matching/services/match-client-store";
import {
  extractSuchprofilFromText,
  isSuchprofilExtractionConfident,
} from "@/features/matching/services/suchprofil-extractor";

/** Extrahiert Suchprofil-Signale aus Kundenakte-Text und queued Bestätigung. */
export function detectSuchprofilFromKundenakte(
  record: Kundenakte,
  sourceText: string
): void {
  if (getSuchprofilForKunde(record.id)) return;

  const combined = [sourceText, record.betreff, record.zusammenfassung]
    .filter(Boolean)
    .join("\n");

  const extracted = extractSuchprofilFromText(combined);
  if (!isSuchprofilExtractionConfident(extracted)) return;

  queueSuchprofilExtraction({
    kunde_id: record.id,
    vorgangId: record.vorgangId,
    extracted,
  });
}
