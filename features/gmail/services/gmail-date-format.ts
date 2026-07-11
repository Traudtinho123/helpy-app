const GMAIL_DISPLAY_TIMEZONE = "Europe/Zurich";

function parseGmailDateValue(value: string): Date | null {
  if (!value.trim()) return null;

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;

  return new Date(parsed);
}

const gmailDateFormatter = new Intl.DateTimeFormat("de-CH", {
  timeZone: GMAIL_DISPLAY_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const gmailTimeFormatter = new Intl.DateTimeFormat("de-CH", {
  timeZone: GMAIL_DISPLAY_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Volles Datum + Uhrzeit — z. B. „07.07.2026 15:16“ */
export function formatGmailDateTime(value: string): string {
  const date = parseGmailDateValue(value);
  if (!date) {
    if (!value) return "—";
    return value.length > 32 ? `${value.slice(0, 32)}…` : value;
  }

  return `${gmailDateFormatter.format(date)} ${gmailTimeFormatter.format(date)}`;
}

/** Nur Uhrzeit — z. B. „15:16“ */
export function formatGmailTime(value: string): string {
  const date = parseGmailDateValue(value);
  if (!date) return "—";

  return gmailTimeFormatter.format(date);
}
