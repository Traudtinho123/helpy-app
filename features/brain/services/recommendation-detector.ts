import type {
  BrainV3Intent,
  BrainV3Skill,
} from "@/features/brain/types/brain-v3-types";

const INTENT_RECOMMENDATIONS: Record<BrainV3Intent, string> = {
  "Neue Anfrage": "Antwort vorbereiten",
  Interessentenanfrage: "Interessent prüfen",
  Angebotsanfrage: "Offerte vorbereiten",
  Besichtigung: "Besichtigung vorschlagen",
  "Vor-Ort-Termin": "Vor-Ort-Termin vorschlagen",
  Materialanfrage: "Materialanfrage prüfen",
  Auftragsanfrage: "Auftrag prüfen",
  Mandatsanfrage: "Mandat prüfen",
  Erstgespräch: "Erstgespräch vorbereiten",
  Geschäftsanfrage: "Anfrage prüfen",
  "Bestandskunden-Kommunikation": "Antwort vorbereiten",
  Rückruf: "Rückruf planen",
  Terminwunsch: "Termin vorschlagen",
  Frist: "Frist prüfen",
  Rechnung: "Dokument prüfen",
  Dokument: "Dokument prüfen",
  "Normale Nachricht": "Antwort vorbereiten",
  "Sonstiges / Unklar": "Nachricht prüfen",
  "Spam / Newsletter": "Archivieren",
};

const SKILL_OVERRIDES: Partial<
  Record<BrainV3Skill, Partial<Record<BrainV3Intent, string>>>
> = {
  "HELPY Real Estate": {
    Besichtigung: "Besichtigung vorschlagen",
    Interessentenanfrage: "Interessent prüfen",
    Terminwunsch: "Besichtigung vorschlagen",
    "Neue Anfrage": "Besichtigung vorschlagen",
  },
  "HELPY Construction": {
    Angebotsanfrage: "Offerte vorbereiten",
    "Vor-Ort-Termin": "Vor-Ort-Termin vorschlagen",
    Materialanfrage: "Material klären",
    Auftragsanfrage: "Auftrag prüfen",
    "Neue Anfrage": "Offerte vorbereiten",
  },
  "HELPY Consulting & Legal": {
    Frist: "Frist prüfen",
    Mandatsanfrage: "Mandat prüfen",
    Erstgespräch: "Erstgespräch vorbereiten",
    "Neue Anfrage": "Erstgespräch vorbereiten",
  },
};

/** Regelbasierte Empfehlung — später durch KI ersetzbar. */
export function detectRecommendation(
  intent: BrainV3Intent,
  skill: BrainV3Skill
): string {
  return (
    SKILL_OVERRIDES[skill]?.[intent] ??
    INTENT_RECOMMENDATIONS[intent] ??
    "Antwort vorbereiten"
  );
}
