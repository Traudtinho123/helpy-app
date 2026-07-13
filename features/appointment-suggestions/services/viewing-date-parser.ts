import {
  addDaysToZurichDate,
  getZurichDateString,
} from "@/features/apple-calendar/services/apple-caldav-timezone";

const WEEKDAY_OFFSET: Record<string, number> = {
  montag: 1,
  dienstag: 2,
  mittwoch: 3,
  donnerstag: 4,
  freitag: 5,
  samstag: 6,
  sonntag: 0,
};

function parseIsoDate(value: string): string | null {
  const isoMatch = value.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const deMatch = value.match(/\b(\d{1,2})\.(\d{1,2})\.(20\d{2})\b/);
  if (deMatch) {
    return `${deMatch[3]}-${deMatch[2].padStart(2, "0")}-${deMatch[1].padStart(2, "0")}`;
  }

  return null;
}

function getWeekdayFromText(text: string): number | null {
  for (const [name, day] of Object.entries(WEEKDAY_OFFSET)) {
    if (text.includes(name)) return day;
  }
  return null;
}

function resolveWeekdayDate(
  weekday: number,
  referenceDate: string,
  normalizedText: string
): string {
  const [year, month, day] = referenceDate.split("-").map(Number);
  const anchor = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const currentWeekday = anchor.getUTCDay();
  let delta = (weekday - currentWeekday + 7) % 7;
  if (delta === 0) delta = 7;
  if (
    normalizedText.includes("nächste woche") ||
    normalizedText.includes("naechste woche")
  ) {
    delta += 7;
  }
  return addDaysToZurichDate(referenceDate, delta);
}

/** Versucht, ein Ziel-Datum aus Besichtigungstext zu parsen. */
export function parseViewingTargetDate(
  text: string,
  referenceDate = getZurichDateString()
): string | null {
  const normalized = text.toLowerCase();
  const direct = parseIsoDate(normalized);
  if (direct) return direct;

  const weekday = getWeekdayFromText(normalized);
  if (weekday !== null) {
    return resolveWeekdayDate(weekday, referenceDate, normalized);
  }

  if (
    normalized.includes("nächste woche") ||
    normalized.includes("naechste woche")
  ) {
    return addDaysToZurichDate(referenceDate, 7);
  }

  if (normalized.includes("morgen")) {
    return addDaysToZurichDate(referenceDate, 1);
  }

  return null;
}

/** Nächste N offene Tage ab morgen (gefiltert über isDayOpen). */
export function getNextOpenDates(
  count = 5,
  isDayOpen: (isoDate: string) => boolean,
  referenceDate = getZurichDateString(),
  maxScanDays = 21
): string[] {
  const dates: string[] = [];
  let cursor = referenceDate;
  let scanned = 0;

  while (dates.length < count && scanned < maxScanDays) {
    cursor = addDaysToZurichDate(cursor, 1);
    scanned += 1;
    if (isDayOpen(cursor)) {
      dates.push(cursor);
    }
  }

  return dates;
}

/** @deprecated Nutze getNextOpenDates mit Scheduling-Policy. */
export function getNextWeekdayDates(
  count = 5,
  referenceDate = getZurichDateString()
): string[] {
  return getNextOpenDates(count, (isoDate) => {
    const [year, month, day] = isoDate.split("-").map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
    return weekday >= 1 && weekday <= 5;
  }, referenceDate);
}

export function resolveViewingTargetDates(
  text: string,
  isDayOpen?: (isoDate: string) => boolean,
  /** Anzahl Tage für Slot-Suche (Default 5, Besichtigung: 14). */
  openDayCount = 5
): string[] {
  const openDay = isDayOpen ?? ((isoDate: string) => {
    const [year, month, day] = isoDate.split("-").map(Number);
    const weekday = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
    return weekday >= 1 && weekday <= 5;
  });

  const target = parseViewingTargetDate(text);
  if (target) {
    if (openDay(target)) return [target];
  }

  return getNextOpenDates(openDayCount, openDay, getZurichDateString(), openDayCount + 7);
}

export function formatGermanDateLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;

  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekday = new Intl.DateTimeFormat("de-CH", {
    weekday: "long",
    timeZone: "UTC",
  }).format(date);
  const monthLabel = new Intl.DateTimeFormat("de-CH", {
    month: "long",
    timeZone: "UTC",
  }).format(date);

  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${day}. ${monthLabel}`;
}
