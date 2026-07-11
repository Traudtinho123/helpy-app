import type { AppointmentSlot } from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import {
  formatGermanDateLabel,
  parseViewingTargetDate,
} from "@/features/appointment-suggestions/services/viewing-date-parser";
import {
  addMinutesToTimeString,
  formatParsedTime,
  parseGermanTime,
} from "@/features/appointment-suggestions/services/viewing-time-parser";

const CONFIRMATION_KEYWORDS = [
  "passt",
  "bestätig",
  "bestaetig",
  "bestätige",
  "nehme",
  "nehm",
  "gerne",
  "einverstanden",
  "ok ",
  " okay",
  "termin bestätigt",
  "passt mir",
  "klingt gut",
];

export type DetectedViewingConfirmation = {
  slot: AppointmentSlot;
  matchedText: string;
  timeRecognized: boolean;
  rawTime: string | null;
};

function normalizeTime(value: string): string {
  return value.replace(".", ":").trim();
}

function slotMentionedInText(slot: AppointmentSlot, text: string): boolean {
  const normalized = text.toLowerCase();
  const start = normalizeTime(slot.start);
  const end = normalizeTime(slot.end);

  if (normalized.includes(start) || normalized.includes(`${start} uhr`)) {
    return true;
  }

  if (normalized.includes(slot.dateLabel.toLowerCase())) {
    return true;
  }

  const dateParts = slot.date.split("-");
  if (dateParts.length === 3) {
    const day = Number(dateParts[2]);
    const month = Number(dateParts[1]);
    if (
      normalized.includes(`${day}.${month}`) ||
      normalized.includes(`${day}. ${month}`)
    ) {
      return true;
    }
  }

  if (normalized.includes(slot.label.toLowerCase())) {
    return true;
  }

  if (normalized.includes(`${start}–${end}`) || normalized.includes(`${start}-${end}`)) {
    return true;
  }

  return false;
}

function hasConfirmationSignal(text: string): boolean {
  const normalized = text.toLowerCase();
  return CONFIRMATION_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function buildSlotFromParts(options: {
  slotId: string;
  date: string;
  start: string;
  end: string;
  durationMinutes: number;
  calendarLabel: string;
}): AppointmentSlot {
  const dateLabel = formatGermanDateLabel(options.date);
  return {
    id: options.slotId,
    date: options.date,
    dateLabel,
    start: options.start,
    end: options.end,
    label: `${dateLabel} · ${options.start}–${options.end}`,
    durationMinutes: options.durationMinutes,
    calendarLabel: options.calendarLabel,
  };
}

/** Erkennt, ob eine Thread-Antwort einen Besichtigungstermin bestätigt. */
export function detectViewingConfirmationInReply(
  replyText: string,
  suggestedSlots: AppointmentSlot[],
  options?: {
    contextText?: string;
    durationMinutes?: number;
  }
): DetectedViewingConfirmation | null {
  if (!replyText.trim()) return null;

  const normalized = replyText.toLowerCase();
  const haystack = [replyText, options?.contextText].filter(Boolean).join(" ");
  const hasSignal = hasConfirmationSignal(normalized);
  const extractedTime = parseGermanTime(haystack);
  const durationMinutes =
    options?.durationMinutes ?? suggestedSlots[0]?.durationMinutes ?? 45;

  if (!hasSignal && !extractedTime) {
    return null;
  }

  let matchedSlot: AppointmentSlot | null = null;
  for (const slot of suggestedSlots) {
    if (slotMentionedInText(slot, normalized)) {
      matchedSlot = slot;
      break;
    }
  }

  if (extractedTime && !matchedSlot) {
    const formatted = formatParsedTime(extractedTime);
    matchedSlot =
      suggestedSlots.find((slot) => normalizeTime(slot.start) === formatted) ??
      null;
  }

  if (!matchedSlot && hasSignal && suggestedSlots.length === 1) {
    matchedSlot = suggestedSlots[0]!;
  }

  const parsedDate =
    parseViewingTargetDate(haystack) ??
    matchedSlot?.date ??
    suggestedSlots[0]?.date ??
    null;

  if (!parsedDate) {
    return null;
  }

  const calendarLabel =
    matchedSlot?.calendarLabel ?? suggestedSlots[0]?.calendarLabel ?? "Kalender";

  let start: string | null = null;
  let end: string | null = null;
  let timeRecognized = false;
  let rawTime: string | null = null;

  if (extractedTime) {
    start = formatParsedTime(extractedTime);
    end = addMinutesToTimeString(start, durationMinutes);
    timeRecognized = true;
    rawTime = extractedTime.raw;
  } else if (
    matchedSlot &&
    (normalized.includes(normalizeTime(matchedSlot.start)) ||
      normalized.includes(`${normalizeTime(matchedSlot.start)} uhr`))
  ) {
    start = matchedSlot.start;
    end = matchedSlot.end;
    timeRecognized = true;
    rawTime = matchedSlot.start;
  }

  const slot = buildSlotFromParts({
    slotId: matchedSlot?.id ?? `confirmed-${parsedDate}-${start ?? "unknown"}`,
    date: parsedDate,
    start: start ?? "—",
    end: end ?? "—",
    durationMinutes,
    calendarLabel,
  });

  return {
    slot,
    matchedText: replyText.trim().slice(0, 200),
    timeRecognized,
    rawTime,
  };
}

export function buildViewingConfirmationFromSlot(
  slot: AppointmentSlot,
  details: {
    interessent: string;
    objekt: string;
    location: string | null;
    quelle: string;
    snippet: string;
    durationLabel: string;
    timeRecognized?: boolean;
    rawTime?: string | null;
  }
) {
  return {
    interessent: details.interessent,
    objekt: details.objekt,
    date: slot.date,
    dateLabel: slot.dateLabel || formatGermanDateLabel(slot.date),
    start: slot.start,
    end: slot.end,
    durationLabel: details.durationLabel,
    location: details.location,
    quelle: details.quelle,
    snippet: details.snippet,
    confirmedAt: new Date().toISOString(),
    timeRecognized: details.timeRecognized ?? false,
    rawTime: details.rawTime ?? null,
  };
}
