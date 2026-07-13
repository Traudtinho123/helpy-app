import {
  formatCalDavUtc,
  formatCalDavZurichLocal,
  ZURICH_TIMEZONE,
} from "@/features/apple-calendar/services/apple-caldav-timezone";

export type IcsInviteInput = {
  uid: string;
  summary: string;
  description: string;
  location?: string;
  date: string;
  startTime: string;
  endTime: string;
  organizerEmail: string;
  organizerName?: string;
  attendeeEmail?: string | null;
  attendeeName?: string | null;
};

function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Generiert eine RFC5545-konforme .ics Kalendereinladung. */
export function buildIcsCalendarInvite(input: IcsInviteInput): string {
  const [startHour, startMinute] = input.startTime.split(":").map(Number);
  const [endHour, endMinute] = input.endTime.split(":").map(Number);
  const dtStart = formatCalDavZurichLocal(
    input.date,
    startHour,
    startMinute,
    0
  );
  const dtEnd = formatCalDavZurichLocal(input.date, endHour, endMinute, 0);
  const dtStamp = formatCalDavUtc(new Date());
  const organizerName = input.organizerName ?? "HELPY";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HELPY//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VTIMEZONE",
    `TZID:${ZURICH_TIMEZONE}`,
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "DTSTART:19701025T030000",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "END:STANDARD",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    "TZNAME:CEST",
    "DTSTART:19700329T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "END:DAYLIGHT",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=${ZURICH_TIMEZONE}:${dtStart}`,
    `DTEND;TZID=${ZURICH_TIMEZONE}:${dtEnd}`,
    `SUMMARY:${escapeIcsText(input.summary)}`,
    input.location ? `LOCATION:${escapeIcsText(input.location)}` : "",
    `DESCRIPTION:${escapeIcsText(input.description)}`,
    `ORGANIZER;CN=${escapeIcsText(organizerName)}:mailto:${input.organizerEmail}`,
    input.attendeeEmail
      ? `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${escapeIcsText(input.attendeeName ?? input.attendeeEmail)}:mailto:${input.attendeeEmail}`
      : "",
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}

export function icsToBase64(icsContent: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(icsContent, "utf-8").toString("base64");
  }
  const bytes = new TextEncoder().encode(icsContent);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
