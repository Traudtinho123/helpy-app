import type { CalendarEvent, CalendarEventType } from "@/features/calendar/mock/mock-calendar";
import type { WorkdayTerminItem } from "@/features/workday/services/workday-summary";
import type { AppleCalDavEvent } from "@/features/apple-calendar/types/apple-calendar-types";

function formatTime(isoDateTime: string): string {
  const match = isoDateTime.match(/T(\d{2}):(\d{2})/);
  if (!match) return "00:00";
  return `${match[1]}:${match[2]}`;
}

function formatDate(isoDateTime: string): string {
  return isoDateTime.slice(0, 10);
}

function inferEventType(summary: string, description?: string): CalendarEventType {
  const text = `${summary} ${description ?? ""}`.toLowerCase();

  if (text.includes("besichtigung") || text.includes("immobil")) {
    return "besichtigung";
  }
  if (text.includes("telefonat") || text.includes("anruf")) {
    return "telefonat";
  }
  if (text.includes("angebot") || text.includes("offerte")) {
    return "angebot";
  }

  return "termin";
}

function buildHelpyHint(event: AppleCalDavEvent): string {
  const parts: string[] = [];

  if (event.calendarName) {
    parts.push(event.calendarName);
  }

  if (event.attendees && event.attendees.length > 0) {
    parts.push(`Teilnehmer: ${event.attendees.join(", ")}`);
  } else if (event.description) {
    parts.push(event.description);
  }

  return parts.length > 0 ? parts.join(" — ") : "Aus Apple Kalender übernommen.";
}

/** Mappt iCloud-CalDAV-Events auf den gemeinsamen CalendarEvent-Typ. */
export function mapAppleEventToCalendarEvent(event: AppleCalDavEvent): CalendarEvent {
  const date = formatDate(event.startAt);
  const time = event.isAllDay ? "00:00" : formatTime(event.startAt);
  const endTime = event.isAllDay ? undefined : formatTime(event.endAt);

  return {
    id: `apple-${event.uid}`,
    time,
    endTime,
    title: event.summary,
    subtitle: event.location ?? event.calendarName,
    type: inferEventType(event.summary, event.description),
    helpyHint: buildHelpyHint(event),
    date,
    location: event.location,
    participants: event.attendees,
    calendarName: event.calendarName,
  };
}

export function mapAppleEventsToCalendarEvents(
  events: AppleCalDavEvent[]
): CalendarEvent[] {
  return events
    .map(mapAppleEventToCalendarEvent)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
}

function buildWorkdayKundeLabel(event: CalendarEvent): string {
  if (event.location) return event.location;
  if (event.participants && event.participants.length > 0) {
    return event.participants.join(", ");
  }
  if (event.calendarName) return event.calendarName;
  return "Apple Kalender";
}

/** Mappt CalendarEvent auf Workday-Termin für „Termine von heute“. */
export function mapCalendarEventToWorkdayTermin(
  event: CalendarEvent
): WorkdayTerminItem {
  return {
    id: event.id,
    titel: event.title,
    kunde: event.subtitle ?? buildWorkdayKundeLabel(event),
    uhrzeit: event.time === "00:00" ? null : event.time,
    endUhrzeit: event.endTime && event.endTime !== "00:00" ? event.endTime : null,
    ort: event.location ?? null,
    quelle: "Apple Kalender",
    href: event.vorgangId ? `/workspace/${event.vorgangId}` : "/kalender",
  };
}

export function mapAppleEventsToWorkdayTermine(
  events: CalendarEvent[]
): WorkdayTerminItem[] {
  return events.map(mapCalendarEventToWorkdayTermin);
}
