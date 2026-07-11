/** Signale für einen Besichtigungswunsch in E-Mails. */
export const VIEWING_REQUEST_KEYWORDS = [
  "besichtigung",
  "besichtigen",
  "anschauen",
  "ansehen",
  "termin",
  "wann möglich",
  "wann moeglich",
  "donnerstag",
  "freitag",
  "nächste woche",
  "naechste woche",
  "am abend",
  "vormittags",
  "nachmittags",
] as const;

function containsAny(text: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

export function hasViewingRequestSignal(text: string): boolean {
  return containsAny(text.toLowerCase(), VIEWING_REQUEST_KEYWORDS);
}

export function isRealEstateViewingContext(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    hasViewingRequestSignal(normalized) &&
    (normalized.includes("immobil") ||
      normalized.includes("wohnung") ||
      normalized.includes("objekt") ||
      normalized.includes("haus") ||
      normalized.includes("miet") ||
      normalized.includes("kauf") ||
      normalized.includes("besichtigung") ||
      normalized.includes("immoscout") ||
      normalized.includes("homegate") ||
      normalized.includes("inserat"))
  );
}
