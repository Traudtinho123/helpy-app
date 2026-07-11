import { minutesToTime, parseTimeToMinutes } from "@/features/calendar/services/availability-engine";

export type ParsedGermanTime = {
  hour: number;
  minute: number;
  raw: string;
};

const NUMBER_WORDS: Record<string, number> = {
  eins: 1,
  ein: 1,
  eine: 1,
  zwei: 2,
  zwo: 2,
  drei: 3,
  vier: 4,
  fünf: 5,
  fuenf: 5,
  sechs: 6,
  sieben: 7,
  acht: 8,
  neun: 9,
  zehn: 10,
  elf: 11,
  zwölf: 12,
  zwoelf: 12,
};

function wordToNumber(value: string): number | null {
  const normalized = value.toLowerCase().trim();
  if (/^\d{1,2}$/.test(normalized)) {
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return NUMBER_WORDS[normalized] ?? null;
}

function applyMeridiem(hour: number, text: string): number {
  const lower = text.toLowerCase();

  if (/\b(nachmittags|abends|pm|p\.?\s*m\.?)\b/.test(lower) && hour >= 1 && hour <= 11) {
    return hour + 12;
  }

  if (
    /\b(vormittags|morgens|früh|frueh|am\s+morgen|am\s+vormittag)\b/.test(lower) &&
    hour === 12
  ) {
    return 0;
  }

  return hour;
}

function buildResult(
  hour: number,
  minute: number,
  raw: string,
  text: string
): ParsedGermanTime | null {
  const adjustedHour = applyMeridiem(hour, text);
  if (adjustedHour < 0 || adjustedHour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return {
    hour: adjustedHour,
    minute,
    raw: raw.trim(),
  };
}

function parseNumericTime(
  hourText: string,
  minuteText: string | undefined,
  raw: string,
  text: string
): ParsedGermanTime | null {
  const hour = Number(hourText);
  const minute = minuteText ? Number(minuteText) : 0;
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return buildResult(hour, minute, raw, text);
}

function parseHalfHourExpression(
  targetHour: number,
  raw: string,
  text: string
): ParsedGermanTime | null {
  if (targetHour < 1 || targetHour > 12) return null;
  const hour = targetHour === 12 ? 0 : targetHour - 1;
  return buildResult(hour, 30, raw, text);
}

function parseQuarterAfterExpression(
  targetHour: number,
  raw: string,
  text: string
): ParsedGermanTime | null {
  if (targetHour < 0 || targetHour > 23) return null;
  return buildResult(targetHour, 15, raw, text);
}

function parseQuarterBeforeExpression(
  targetHour: number,
  raw: string,
  text: string
): ParsedGermanTime | null {
  if (targetHour < 1 || targetHour > 23) return null;
  return buildResult(targetHour - 1, 45, raw, text);
}

/** Extrahiert eine Uhrzeit aus deutschem Freitext. */
export function parseGermanTime(text: string): ParsedGermanTime | null {
  if (!text.trim()) return null;

  const normalized = text.replace(/\s+/g, " ");

  const patterns: Array<RegExp> = [
    /\bum\s+(\d{1,2})[:.](\d{2})\s*uhr?\b/i,
    /\b(\d{1,2})[:.](\d{2})\s*uhr?\b/i,
    /\bum\s+(\d{1,2})\s*uhr?\b/i,
    /\b(\d{1,2})\s*uhr\b/i,
    /\b(\d{1,2})\s*(?:pm|p\.?\s*m\.?)\b/i,
    /\b(\d{1,2})\s*(?:am|a\.?\s*m\.?)\b/i,
    /\bhalb\s+(eins|ein|eine|zwei|zwo|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwoelf|\d{1,2})\b/i,
    /\bviertel\s+nach\s+(eins|ein|eine|zwei|zwo|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwoelf|\d{1,2})\b/i,
    /\bviertel\s+vor\s+(eins|ein|eine|zwei|zwo|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwoelf|\d{1,2})\b/i,
    /\bdreiviertel\s+(eins|ein|eine|zwei|zwo|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwoelf|\d{1,2})\b/i,
    /\b(\d{1,2}):(\d{2})\b/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;

    const raw = match[0];

    if (/^halb/i.test(raw)) {
      const hourWord = match[1] ?? "";
      const hour = wordToNumber(hourWord);
      if (hour === null) continue;
      const parsed = parseHalfHourExpression(hour, raw, normalized);
      if (parsed) return parsed;
      continue;
    }

    if (/^viertel\s+nach/i.test(raw)) {
      const hourWord = match[1] ?? "";
      const hour = wordToNumber(hourWord);
      if (hour === null) continue;
      const parsed = parseQuarterAfterExpression(hour, raw, normalized);
      if (parsed) return parsed;
      continue;
    }

    if (/^viertel\s+vor|^dreiviertel/i.test(raw)) {
      const hourWord = match[1] ?? "";
      const hour = wordToNumber(hourWord);
      if (hour === null) continue;
      const parsed = parseQuarterBeforeExpression(hour, raw, normalized);
      if (parsed) return parsed;
      continue;
    }

    const parsed = parseNumericTime(match[1] ?? "", match[2], raw, normalized);
    if (parsed) return parsed;
  }

  return null;
}

export function formatParsedTime(time: ParsedGermanTime): string {
  return `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}`;
}

export function addMinutesToTimeString(time: string, minutesToAdd: number): string {
  const total = parseTimeToMinutes(time) + minutesToAdd;
  return minutesToTime(total);
}

export function isValidTimeString(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value) && parseTimeToMinutes(value) >= 0;
}

/** Temporäre Debug-Ausgabe für Termin-Zeitextraktion. */
export function logAppointmentTimeDebug(_payload: {
  rawTime: string | null;
  startTime: string | null;
  endTime: string | null;
  timezone: string;
  calendarPayload: unknown;
}): void {
  // Debug logging disabled for MVP demo.
}
