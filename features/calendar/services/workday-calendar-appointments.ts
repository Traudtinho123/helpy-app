import {
  mapAppleEventsToWorkdayTermine,
} from "@/features/apple-calendar/services/apple-calendar-mapper";
import { getZurichDateString } from "@/features/apple-calendar/services/apple-caldav-timezone";
import {
  getConnectedCalendarPlatform,
  getGoogleCalendarEventsForToday,
  type CalendarPlatform,
} from "@/features/calendar/services/calendar-platform";
import type { CalendarEvent } from "@/features/calendar/mock/mock-calendar";
import type { WorkdayTerminItem } from "@/features/workday/services/workday-summary";

function mapGoogleEventToWorkdayTermin(event: CalendarEvent): WorkdayTerminItem {
  return {
    id: event.id,
    titel: event.title,
    kunde: event.subtitle ?? "Google Kalender",
    uhrzeit: event.time === "00:00" ? null : event.time,
    endUhrzeit: event.endTime && event.endTime !== "00:00" ? event.endTime : null,
    ort: event.location ?? null,
    quelle: "Google Kalender",
    href: event.vorgangId ? `/workspace/${event.vorgangId}` : "/kalender",
  };
}

function mapGoogleEventsToWorkdayTermine(events: CalendarEvent[]): WorkdayTerminItem[] {
  return events.map(mapGoogleEventToWorkdayTermin);
}

function sortAppointments(items: WorkdayTerminItem[]): WorkdayTerminItem[] {
  return [...items].sort((a, b) => {
    if (!a.uhrzeit && !b.uhrzeit) return 0;
    if (!a.uhrzeit) return 1;
    if (!b.uhrzeit) return -1;
    return a.uhrzeit.localeCompare(b.uhrzeit);
  });
}

/** Termine von heute — nur aus der verbundenen Kalender-Plattform. */
export function buildWorkdayCalendarAppointments(
  platform: CalendarPlatform | null,
  appleEvents: CalendarEvent[]
): WorkdayTerminItem[] {
  if (!platform) return [];

  if (platform === "apple") {
    const today = getZurichDateString();
    const todayEvents = appleEvents.filter((event) => event.date === today);
    return sortAppointments(mapAppleEventsToWorkdayTermine(todayEvents));
  }

  return sortAppointments(mapGoogleEventsToWorkdayTermine(getGoogleCalendarEventsForToday()));
}

export function buildWorkdayCalendarAppointmentsFromState(
  appleEvents: CalendarEvent[]
): WorkdayTerminItem[] {
  return buildWorkdayCalendarAppointments(
    getConnectedCalendarPlatform(),
    appleEvents
  );
}
