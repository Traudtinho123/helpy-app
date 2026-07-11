/** Wochen- und Tagesgrenzen in einer IANA-Zeitzone (Default: Europe/Zurich). */

export const DEFAULT_ANALYTICS_TIMEZONE = "Europe/Zurich";

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  weekdayIndex: number;
};

function readZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  const weekdayMap: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    weekdayIndex: weekdayMap[lookup.weekday ?? "Mon"] ?? 0,
  };
}

function zonedLocalToUtc(
  parts: Pick<ZonedParts, "year" | "month" | "day"> & {
    hour?: number;
    minute?: number;
    second?: number;
  },
  timeZone: string
): Date {
  const hour = parts.hour ?? 0;
  const minute = parts.minute ?? 0;
  const second = parts.second ?? 0;
  const guess = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, second)
  );

  const asZoned = readZonedParts(guess, timeZone);
  const targetMs = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    hour,
    minute,
    second
  );
  const actualMs = Date.UTC(
    asZoned.year,
    asZoned.month - 1,
    asZoned.day,
    asZoned.hour,
    minute,
    second
  );

  return new Date(guess.getTime() + (targetMs - actualMs));
}

export function startOfDayInTimezone(date: Date, timeZone: string): Date {
  const parts = readZonedParts(date, timeZone);
  return zonedLocalToUtc(
    { year: parts.year, month: parts.month, day: parts.day, hour: 0, minute: 0, second: 0 },
    timeZone
  );
}

export function endOfDayInTimezone(date: Date, timeZone: string): Date {
  const start = startOfDayInTimezone(date, timeZone);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function startOfWeekInTimezone(
  date: Date,
  timeZone: string
): Date {
  const parts = readZonedParts(date, timeZone);
  const dayOffset = parts.weekdayIndex;
  const dayStart = zonedLocalToUtc(
    { year: parts.year, month: parts.month, day: parts.day, hour: 0, minute: 0, second: 0 },
    timeZone
  );
  return new Date(dayStart.getTime() - dayOffset * 24 * 60 * 60 * 1000);
}

export function endOfWeekInTimezone(date: Date, timeZone: string): Date {
  const weekStart = startOfWeekInTimezone(date, timeZone);
  return new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
}

export function addDaysInTimezone(date: Date, days: number, timeZone: string): Date {
  const parts = readZonedParts(date, timeZone);
  const anchor = zonedLocalToUtc(
    { year: parts.year, month: parts.month, day: parts.day, hour: 12 },
    timeZone
  );
  return new Date(anchor.getTime() + days * 24 * 60 * 60 * 1000);
}

export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export const WEEKDAY_LABELS_DE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;

export function getHourInTimezone(iso: string, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hour12: false,
  });
  return Number(formatter.format(new Date(iso)));
}

export function getWeekdayIndexInTimezone(iso: string, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  });
  const weekdayMap: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return weekdayMap[formatter.format(new Date(iso))] ?? 0;
}

export function getDateKeyInTimezone(iso: string, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date(iso));
}

export function getMinuteInTimezone(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    minute: "numeric",
  });
  return Number(formatter.format(date));
}

/** ISO-Kalenderwoche (KW) in einer Zeitzone, z.B. 27 */
export function getIsoWeekNumberInTimezone(
  date: Date,
  timeZone: string
): number {
  const { year, month, day } = readZonedParts(date, timeZone);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

/** Schlüssel für Versand-Deduplizierung, z.B. 2026-W27 */
export function getIsoWeekKeyInTimezone(date: Date, timeZone: string): string {
  const { year, month, day } = readZonedParts(date, timeZone);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const isoWeekYear = utc.getUTCFullYear();
  const week = getIsoWeekNumberInTimezone(date, timeZone);
  return `${isoWeekYear}-W${String(week).padStart(2, "0")}`;
}

/** Montag 05:30–05:44 Europe/Zurich — Versandfenster für Wochenbericht */
export function isWeeklyReportSendWindow(
  date: Date,
  timeZone: string = DEFAULT_ANALYTICS_TIMEZONE
): boolean {
  const weekday = getWeekdayIndexInTimezone(date.toISOString(), timeZone);
  const hour = getHourInTimezone(date.toISOString(), timeZone);
  const minute = getMinuteInTimezone(date, timeZone);
  return weekday === 0 && hour === 5 && minute >= 30 && minute <= 44;
}

/** Start/Ende der abgeschlossenen Vorwoche (Mo 00:00 – So 23:59:59.999) */
export function getPreviousWeekRangeInTimezone(
  date: Date,
  timeZone: string
): { start: Date; end: Date } {
  const thisWeekStart = startOfWeekInTimezone(date, timeZone);
  const previousWeekEnd = new Date(thisWeekStart.getTime() - 1);
  const previousWeekStart = startOfWeekInTimezone(previousWeekEnd, timeZone);
  return { start: previousWeekStart, end: previousWeekEnd };
}
