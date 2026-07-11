import type { AppointmentSchedulingPolicy } from "@/features/calendar/services/appointment-scheduling-policy";
import {
  buildAppointmentSchedulingPolicy,
} from "@/features/calendar/services/appointment-scheduling-policy";
import {
  computeFreeSlots,
  type CalendarBusyEvent,
  type FreeSlot,
} from "@/features/calendar/services/availability-engine";
import type { CalendarEvent } from "@/features/calendar/mock/mock-calendar";
import {
  getGoogleCalendarEventsForDate,
  getConnectedCalendarPlatform,
  type CalendarPlatform,
} from "@/features/calendar/services/calendar-platform";
import {
  resolveViewingTargetDates,
} from "@/features/appointment-suggestions/services/viewing-date-parser";
import { appleCalDavClient } from "@/features/apple-calendar/services/apple-caldav-client";
import {
  getAppleCalendarConnection,
  getAppleCalendarCredentials,
  isAppleCalendarConnected,
} from "@/features/apple-calendar/services/apple-calendar-sync";
import {
  addDaysToZurichDate,
  getZurichDateString,
} from "@/features/apple-calendar/services/apple-caldav-timezone";

export type CalendarAvailabilityResult = {
  platform: CalendarPlatform | null;
  platformLabel: string | null;
  date: string;
  slots: FreeSlot[];
  errorMessage: string | null;
};

function mapEventsToBusy(events: CalendarEvent[]): CalendarBusyEvent[] {
  return events.map((event) => ({
    start: event.time,
    end: event.endTime,
  }));
}

function resolveDefaultTargetDate(): string {
  return addDaysToZurichDate(getZurichDateString(), 1);
}

async function fetchAppleEventsForDate(date: string): Promise<CalendarEvent[]> {
  const credentials = getAppleCalendarCredentials();
  if (!credentials) {
    throw new Error("NO_APPLE_CREDENTIALS");
  }

  const result = await appleCalDavClient.fetchEventsForDate({
    appleIdEmail: credentials.appleIdEmail,
    appSpecificPassword: credentials.appSpecificPassword,
    date,
  });

  return result.events;
}

function fetchGoogleEventsForDate(date: string): CalendarEvent[] {
  return getGoogleCalendarEventsForDate(date);
}

export type MultiDayCalendarAvailabilityResult = CalendarAvailabilityResult & {
  slotsByDate: Record<string, FreeSlot[]>;
};

/**
 * Lädt freie Slots über mehrere Werktage.
 * Default: max. 3 Slots auf max. 2 verschiedenen Tagen (Besichtigungs-UX).
 */
export async function loadMultiDayCalendarAvailability(options: {
  targetText?: string;
  durationMinutes: number;
  maxSlots?: number;
  /** Max. Anzahl unterschiedlicher Tage mit Vorschlägen (Default 2). */
  maxDays?: number;
  schedulingPolicy?: AppointmentSchedulingPolicy;
}): Promise<MultiDayCalendarAvailabilityResult> {
  const maxSlots = options.maxSlots ?? 3;
  const maxDays = options.maxDays ?? 2;
  const policy = options.schedulingPolicy ?? buildAppointmentSchedulingPolicy();
  const dates = resolveViewingTargetDates(
    options.targetText ?? "",
    policy.isDayOpen
  );
  const platform = getConnectedCalendarPlatform();

  if (!platform) {
    return {
      platform: null,
      platformLabel: null,
      date: dates[0] ?? resolveDefaultTargetDate(),
      slots: [],
      slotsByDate: {},
      errorMessage: null,
    };
  }

  const platformLabel =
    platform === "apple" ? "Apple Kalender" : "Google Kalender";
  const collected: FreeSlot[] = [];
  const slotsByDate: Record<string, FreeSlot[]> = {};
  let daysWithSlots = 0;

  for (const date of dates) {
    if (collected.length >= maxSlots) break;
    if (daysWithSlots >= maxDays) break;

    const dayResult = await loadCalendarAvailability({
      date,
      durationMinutes: options.durationMinutes,
      maxSlots: maxSlots - collected.length,
      schedulingPolicy: policy,
    });

    if (dayResult.errorMessage && collected.length === 0 && date === dates[0]) {
      return {
        ...dayResult,
        slotsByDate,
      };
    }

    if (dayResult.slots.length === 0) continue;

    slotsByDate[date] = dayResult.slots;
    collected.push(...dayResult.slots);
    daysWithSlots += 1;
  }

  return {
    platform,
    platformLabel,
    date: dates[0] ?? resolveDefaultTargetDate(),
    slots: collected.slice(0, maxSlots),
    slotsByDate,
    errorMessage: collected.length > 0 ? null : "Keine freien Zeiten gefunden.",
  };
}

/** Lädt Kalendertermine und berechnet freie Slots für ein Datum. */
export async function loadCalendarAvailability(options: {
  date?: string;
  durationMinutes: number;
  maxSlots?: number;
  schedulingPolicy?: AppointmentSchedulingPolicy;
}): Promise<CalendarAvailabilityResult> {
  const date = options.date ?? resolveDefaultTargetDate();
  const policy = options.schedulingPolicy ?? buildAppointmentSchedulingPolicy();
  const workingHours = policy.getWorkingHoursForDate(date);

  if (!workingHours) {
    return {
      platform: getConnectedCalendarPlatform(),
      platformLabel: null,
      date,
      slots: [],
      errorMessage: null,
    };
  }

  const platform = getConnectedCalendarPlatform();

  if (!platform) {
    return {
      platform: null,
      platformLabel: null,
      date,
      slots: [],
      errorMessage: null,
    };
  }

  try {
    let events: CalendarEvent[] = [];

    if (platform === "apple" && isAppleCalendarConnected()) {
      events = await fetchAppleEventsForDate(date);
    } else if (platform === "google") {
      events = fetchGoogleEventsForDate(date);
    }

    const slots = computeFreeSlots({
      date,
      existingEvents: mapEventsToBusy(events),
      durationMinutes: options.durationMinutes,
      bufferMinutes: policy.bufferMinutes,
      workingHours,
      maxSlots: options.maxSlots ?? 5,
    });

    return {
      platform,
      platformLabel: platform === "apple" ? "Apple Kalender" : "Google Kalender",
      date,
      slots,
      errorMessage: null,
    };
  } catch {
    return {
      platform,
      platformLabel: platform === "apple" ? "Apple Kalender" : "Google Kalender",
      date,
      slots: [],
      errorMessage:
        platform === "apple"
          ? "Apple Kalender konnte nicht gelesen werden. Bitte Zugang prüfen."
          : "Google Kalender konnte nicht gelesen werden.",
    };
  }
}

export function getAppleCalendarWriteConfig(): {
  calendarId: string;
  calendarName: string;
  appleIdEmail: string;
} | null {
  const connection = getAppleCalendarConnection();
  const credentials = getAppleCalendarCredentials();

  if (
    !connection?.calendarId ||
    !connection.appleIdEmail ||
    !credentials
  ) {
    return null;
  }

  return {
    calendarId: connection.calendarId,
    calendarName: connection.calendarName ?? "Apple Kalender",
    appleIdEmail: connection.appleIdEmail,
  };
}

export { resolveDefaultTargetDate };
