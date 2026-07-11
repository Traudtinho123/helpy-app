export type WorkingHours = {
  start: string;
  end: string;
};

export type CalendarBusyEvent = {
  start: string;
  end?: string;
};

export type FreeSlot = {
  start: string;
  end: string;
  label: string;
};

export type AvailabilityInput = {
  date: string;
  existingEvents: CalendarBusyEvent[];
  durationMinutes: number;
  bufferMinutes: number;
  workingHours: WorkingHours;
  maxSlots?: number;
};

const DEFAULT_EVENT_DURATION_MINUTES = 60;

export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const normalized = Math.max(0, minutes);
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function formatSlotLabel(start: string, end: string): string {
  return `${start}–${end}`;
}

/** Berechnet freie Zeitfenster innerhalb der Arbeitszeiten. */
export function computeFreeSlots(input: AvailabilityInput): FreeSlot[] {
  const workStart = parseTimeToMinutes(input.workingHours.start);
  const workEnd = parseTimeToMinutes(input.workingHours.end);
  const slotDuration = input.durationMinutes;
  const buffer = input.bufferMinutes;
  const maxSlots = input.maxSlots ?? 5;

  const busyIntervals = input.existingEvents
    .map((event) => {
      const start = parseTimeToMinutes(event.start);
      const end = event.end
        ? parseTimeToMinutes(event.end)
        : start + DEFAULT_EVENT_DURATION_MINUTES;
      return {
        start: Math.max(workStart, start - buffer),
        end: Math.min(workEnd, end + buffer),
      };
    })
    .filter((interval) => interval.end > interval.start)
    .sort((a, b) => a.start - b.start);

  const mergedBusy: Array<{ start: number; end: number }> = [];

  for (const interval of busyIntervals) {
    const last = mergedBusy.at(-1);
    if (!last || interval.start > last.end) {
      mergedBusy.push({ ...interval });
      continue;
    }
    last.end = Math.max(last.end, interval.end);
  }

  const freeSlots: FreeSlot[] = [];
  let cursor = workStart;

  for (const busy of mergedBusy) {
    while (cursor + slotDuration <= busy.start && cursor + slotDuration <= workEnd) {
      const slotStart = minutesToTime(cursor);
      const slotEnd = minutesToTime(cursor + slotDuration);
      freeSlots.push({
        start: slotStart,
        end: slotEnd,
        label: formatSlotLabel(slotStart, slotEnd),
      });
      if (freeSlots.length >= maxSlots) return freeSlots;
      cursor += slotDuration + buffer;
    }
    cursor = Math.max(cursor, busy.end);
  }

  while (cursor + slotDuration <= workEnd && freeSlots.length < maxSlots) {
    const slotStart = minutesToTime(cursor);
    const slotEnd = minutesToTime(cursor + slotDuration);
    freeSlots.push({
      start: slotStart,
      end: slotEnd,
      label: formatSlotLabel(slotStart, slotEnd),
    });
    cursor += slotDuration + buffer;
  }

  return freeSlots;
}

export type AppointmentDurationKind =
  | "wohnungsbesichtigung"
  | "baustellenbesichtigung"
  | "erstgespraech";
