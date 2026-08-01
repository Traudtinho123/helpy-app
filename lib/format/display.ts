const SWISS_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

export function formatDisplayDate(
  value: string | Date | null | undefined,
  fallback = "–"
): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString("de-CH", SWISS_DATE_FORMAT);
}

export function formatDisplayNumber(
  value: number | null | undefined,
  fallback = "0"
): string {
  if (value == null || Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat("de-CH").format(value);
}

export function formatChfAmount(
  value: number | null | undefined,
  fallback = "CHF 0"
): string {
  if (value == null || Number.isNaN(value)) return fallback;
  return `CHF ${new Intl.NumberFormat("de-CH").format(value)}`;
}

export function displayText(
  value: string | null | undefined,
  fallback = "–"
): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export function displayName(
  value: string | null | undefined,
  fallback = "Unbekannt"
): string {
  return displayText(value, fallback);
}
