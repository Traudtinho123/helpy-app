/** Feste Referenz für Mock-Daten — keine Laufzeit-Uhr. */
export const MOCK_REFERENCE_ISO = "2026-07-07T12:00:00+02:00";

function normalizeIsoInput(iso: string | undefined | null): string {
  if (typeof iso !== "string" || !iso.trim()) {
    return MOCK_REFERENCE_ISO;
  }
  return iso.trim();
}

/** Liest HH:MM direkt aus ISO-String — identisch auf Server und Client. */
export function staticTimeFromIso(iso: string, offsetMinutes = 0): string {
  const normalized = normalizeIsoInput(iso);
  const match = normalized.match(/T(\d{2}):(\d{2})/);
  if (!match) return "09:00";

  const totalMinutes =
    parseInt(match[1], 10) * 60 + parseInt(match[2], 10) + offsetMinutes;
  const wrappedMinutes =
    ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(wrappedMinutes / 60);
  const mins = wrappedMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/** Erzeugt ISO mit Minuten-Offset ohne Date-Objekt. */
export function staticIsoWithOffset(iso: string, offsetMinutes: number): string {
  const normalized = normalizeIsoInput(iso);
  const match = normalized.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::\d{2})?(?:\.\d+)?([+-]\d{2}:\d{2}|Z)?/
  );
  if (!match) return normalized;

  const [, datePart, hourStr, minuteStr, tz = "+02:00"] = match;
  const totalMinutes =
    parseInt(hourStr, 10) * 60 + parseInt(minuteStr, 10) + offsetMinutes;
  const wrappedMinutes =
    ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = String(Math.floor(wrappedMinutes / 60)).padStart(2, "0");
  const mins = String(wrappedMinutes % 60).padStart(2, "0");

  return `${datePart}T${hours}:${mins}:00${tz}`;
}
