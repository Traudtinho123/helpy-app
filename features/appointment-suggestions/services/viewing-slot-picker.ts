import type { FreeSlot } from "@/features/calendar/services/availability-engine";
import { parseTimeToMinutes } from "@/features/calendar/services/availability-engine";
import {
  addDaysToZurichDate,
  getZurichDateString,
} from "@/features/apple-calendar/services/apple-caldav-timezone";

export type ViewingSlotCandidate = {
  date: string;
  slot: FreeSlot;
};

export type PickViewingSlotsOptions = {
  maxSlots?: number;
  maxDays?: number;
  referenceDate?: string;
  /** Mindestabstand in Stunden ab jetzt (Default 24). */
  minLeadHours?: number;
  now?: Date;
};

function isoDateToWeekday(isoDate: string): number {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
}

function isAtLeastLeadHoursAhead(
  date: string,
  startTime: string,
  minLeadHours: number,
  now: Date
): boolean {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = startTime.split(":").map(Number);
  const slotStart = new Date(
    year,
    month - 1,
    day,
    hours ?? 0,
    minutes ?? 0,
    0,
    0
  );
  const diffMs = slotStart.getTime() - now.getTime();
  return diffMs >= minLeadHours * 60 * 60 * 1000;
}

/** Bevorzugte Zeiten: vor 12:00 oder 14:00–17:00; Montag früh / Freitag spät abwerten. */
export function scoreViewingSlot(date: string, slot: FreeSlot): number {
  const startMinutes = parseTimeToMinutes(slot.start);
  const weekday = isoDateToWeekday(date);
  let score = 0;

  if (startMinutes < 12 * 60) {
    score += 30;
  } else if (startMinutes >= 14 * 60 && startMinutes < 17 * 60) {
    score += 30;
  } else if (startMinutes >= 12 * 60 && startMinutes < 14 * 60) {
    score += 5;
  } else {
    score -= 10;
  }

  if (weekday === 1 && startMinutes < 9 * 60) {
    score -= 50;
  }

  if (weekday === 5 && startMinutes >= 16 * 60) {
    score -= 40;
  }

  if (weekday === 6 || weekday === 0) {
    score -= 20;
  }

  return score;
}

/**
 * Wählt genau 3 (oder maxSlots) Termine aus freien Slots:
 * auf max. 2 verschiedene Tage verteilt, bevorzugte Uhrzeiten, min. 24h Vorlauf.
 */
export function pickPreferredViewingSlots(
  slotsByDate: Record<string, FreeSlot[]>,
  options: PickViewingSlotsOptions = {}
): ViewingSlotCandidate[] {
  const maxSlots = options.maxSlots ?? 3;
  const maxDays = options.maxDays ?? 2;
  const minLeadHours = options.minLeadHours ?? 24;
  const now = options.now ?? new Date();
  const referenceDate = options.referenceDate ?? getZurichDateString();

  const candidates: ViewingSlotCandidate[] = [];

  for (const [date, daySlots] of Object.entries(slotsByDate)) {
    for (const slot of daySlots) {
      if (!isAtLeastLeadHoursAhead(date, slot.start, minLeadHours, now)) {
        continue;
      }
      if (date < referenceDate) continue;
      candidates.push({ date, slot });
    }
  }

  if (candidates.length === 0) return [];

  const sorted = [...candidates].sort((a, b) => {
    const scoreDiff =
      scoreViewingSlot(b.date, b.slot) - scoreViewingSlot(a.date, a.slot);
    if (scoreDiff !== 0) return scoreDiff;
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.slot.start.localeCompare(b.slot.start);
  });

  const picked: ViewingSlotCandidate[] = [];
  const usedDates = new Set<string>();

  for (const candidate of sorted) {
    if (picked.length >= maxSlots) break;

    if (
      usedDates.size >= maxDays &&
      !usedDates.has(candidate.date)
    ) {
      continue;
    }

    const duplicate = picked.some(
      (item) =>
        item.date === candidate.date && item.slot.start === candidate.slot.start
    );
    if (duplicate) continue;

    picked.push(candidate);
    usedDates.add(candidate.date);
  }

  if (picked.length < maxSlots) {
    for (const candidate of sorted) {
      if (picked.length >= maxSlots) break;
      const duplicate = picked.some(
        (item) =>
          item.date === candidate.date && item.slot.start === candidate.slot.start
      );
      if (duplicate) continue;
      picked.push(candidate);
    }
  }

  return picked
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.slot.start.localeCompare(b.slot.start);
    })
    .slice(0, maxSlots);
}

export function buildSlotIso(date: string, time: string): string {
  return `${date}T${time}:00`;
}

export function formatSlotUhrzeit(time: string): string {
  return `${time} Uhr`;
}

export { addDaysToZurichDate };
