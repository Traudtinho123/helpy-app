import type {
  BrainV3Intent,
  BrainV3Priority,
} from "@/features/brain/types/brain-v3-types";

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

/** Regelbasierte Priorität — später durch KI ersetzbar. */
export function detectGmailPriority(
  text: string,
  intent: BrainV3Intent
): BrainV3Priority {
  const normalized = text.toLowerCase();

  if (intent === "Spam / Newsletter") {
    return "niedrig";
  }

  if (intent === "Sonstiges / Unklar") {
    return "niedrig";
  }

  if (
    containsAny(normalized, ["dringend", "sofort", "asap", "unbedingt"]) ||
    (containsAny(normalized, ["heute", "morgen"]) &&
      containsAny(normalized, ["frist", "rückmeldung", "rueckmeldung"]))
  ) {
    return "kritisch";
  }

  if (
    containsAny(normalized, [
      "morgen",
      "heute",
      "dringend",
      "frist",
      "rückmeldung bis",
      "rueckmeldung bis",
    ])
  ) {
    return "hoch";
  }

  if (
    intent === "Angebotsanfrage" ||
    intent === "Besichtigung" ||
    intent === "Interessentenanfrage" ||
    intent === "Vor-Ort-Termin" ||
    intent === "Materialanfrage" ||
    intent === "Auftragsanfrage" ||
    intent === "Mandatsanfrage" ||
    intent === "Erstgespräch"
  ) {
    return "hoch";
  }

  if (intent === "Frist" || intent === "Rückruf") {
    return "hoch";
  }

  if (
    intent === "Normale Nachricht" ||
    intent === "Neue Anfrage" ||
    intent === "Bestandskunden-Kommunikation" ||
    intent === "Geschäftsanfrage"
  ) {
    return "mittel";
  }

  if (intent === "Rechnung" || intent === "Dokument") {
    return "mittel";
  }

  return "mittel";
}
