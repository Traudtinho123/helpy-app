const FAREWELL_PATTERN =
  /\b(danke|vielen dank|herzlichen dank|tschüss|tschuess|tschüs|auf wiedersehen|auf wiederhören|wiederhören|wiedersehen|bis bald|schönen tag|schönen abend|einen schönen tag|machs gut|ciao)\b/i;

/** Erkennt natürliches Gesprächsende durch den Anrufer. */
export function isCallerFarewell(text: string): boolean {
  const normalized = text.trim();
  if (normalized.length < 3) return false;
  return FAREWELL_PATTERN.test(normalized);
}
