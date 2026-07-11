const ZURICH_TZ = "Europe/Zurich";

export function getZurichDateString(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZURICH_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getZurichTimeParts(date: Date): {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
} {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZURICH_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

function formatZurichInstant(date: string, hour: number, minute: number, second: number): string {
  return `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
}

/** Wandelt eine lokale Zürich-Zeit in UTC um. */
export function zurichLocalInstantToUtc(
  date: string,
  hour = 0,
  minute = 0,
  second = 0
): Date {
  const target = formatZurichInstant(date, hour, minute, second);
  const [year, month, day] = date.split("-").map(Number);
  let guess = Date.UTC(year, month - 1, day, hour - 1, minute, second);

  for (let attempt = 0; attempt < 96; attempt += 1) {
    const probe = new Date(guess);
    const parts = getZurichTimeParts(probe);
    const current = formatZurichInstant(
      `${parts.year}-${parts.month}-${parts.day}`,
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );

    if (current === target) return probe;
    guess += current < target ? 15 * 60 * 1000 : -15 * 60 * 1000;
  }

  return new Date(guess);
}

export function formatCalDavUtc(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

export function addDaysToZurichDate(date: string, days: number): string {
  const anchor = zurichLocalInstantToUtc(date, 12, 0, 0);
  return getZurichDateString(new Date(anchor.getTime() + days * 24 * 60 * 60 * 1000));
}

/** Formatiert lokale Zürich-Zeit für CalDAV (ohne UTC-Verschiebung). */
export function formatCalDavZurichLocal(
  date: string,
  hour: number,
  minute: number,
  second = 0
): string {
  const [year, month, day] = date.split("-");
  return (
    `${year}${month}${day}T` +
    `${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}${String(second).padStart(2, "0")}`
  );
}

export const ZURICH_TIMEZONE = ZURICH_TZ;
export function getZurichTodayWindow(): { start: string; end: string; date: string } {
  return getZurichDateWindow(getZurichDateString());
}

/** Beliebiges Datum 00:00 bis Folgetag 00:00 in Europe/Zurich. */
export function getZurichDateWindow(date: string): {
  start: string;
  end: string;
  date: string;
} {
  const startUtc = zurichLocalInstantToUtc(date, 0, 0, 0);
  const endUtc = zurichLocalInstantToUtc(addDaysToZurichDate(date, 1), 0, 0, 0);

  return {
    date,
    start: formatCalDavUtc(startUtc),
    end: formatCalDavUtc(endUtc),
  };
}
