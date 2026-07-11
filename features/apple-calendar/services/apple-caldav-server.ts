import type {
  AppleCalDavCalendar,
  AppleCalDavEvent,
  AppleCalendarConnectInput,
} from "@/features/apple-calendar/types/apple-calendar-types";
import { parseICalEvents } from "@/features/apple-calendar/services/ical-parser";
import {
  addDaysToZurichDate,
  formatCalDavUtc,
  formatCalDavZurichLocal,
  getZurichDateWindow,
  getZurichTodayWindow,
  ZURICH_TIMEZONE,
} from "@/features/apple-calendar/services/apple-caldav-timezone";

const CALDAV_BASE = "https://caldav.icloud.com";

export type CalDavCredentials = {
  appleIdEmail: string;
  appSpecificPassword: string;
};

export type AppleCalDavSyncResult = {
  calendars: AppleCalDavCalendar[];
  events: AppleCalDavEvent[];
};

function createAuthHeader(credentials: CalDavCredentials): string {
  const token = Buffer.from(
    `${credentials.appleIdEmail}:${credentials.appSpecificPassword}`
  ).toString("base64");
  return `Basic ${token}`;
}

function resolveCalDavUrl(href: string): string {
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  const normalized = href.startsWith("/") ? href : `/${href}`;
  return `${CALDAV_BASE}${normalized}`;
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#xD;/g, "\r")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function extractHrefFromBlock(block: string): string | null {
  const match = block.match(/<(?:[a-z]+:)?href[^>]*>([^<]+)<\/(?:[a-z]+:)?href>/i);
  return match?.[1]?.trim() ?? null;
}

function extractTagValue(block: string, tag: string): string | null {
  const match = block.match(
    new RegExp(`<(?:[a-z]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[a-z]+:)?${tag}>`, "i")
  );
  return match?.[1] ? decodeXmlEntities(match[1].trim()) : null;
}

function extractResponseBlocks(xml: string): string[] {
  return [...xml.matchAll(/<(?:[a-z]+:)?response[\s>][\s\S]*?<\/(?:[a-z]+:)?response>/gi)].map(
    (match) => match[0]
  );
}

function isSuccessfulResponse(block: string): boolean {
  const status = block.match(/<(?:[a-z]+:)?status[^>]*>HTTP\/\d\.\d\s+(\d+)/i);
  if (!status) return true;
  return status[1].startsWith("2");
}

function isCalendarCollection(block: string): boolean {
  return /<(?:[a-z]+:)?calendar(?:\s|\/?>)/i.test(block);
}

function isCalendarHomeCollection(href: string): boolean {
  return /\/calendars\/?$/i.test(href);
}

function isExcludedAppleCalendar(href: string, displayName: string): boolean {
  const haystack = `${href} ${displayName}`.toLowerCase();
  return (
    haystack.includes("inbox") ||
    haystack.includes("notification") ||
    haystack.includes("tasks") ||
    haystack.includes("reminders") ||
    haystack.includes("birthday")
  );
}

export type AppleCalDavCreateEventInput = {
  calendarId: string;
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  date: string;
  startTime: string;
  endTime: string;
};

async function calDavPut(
  url: string,
  credentials: CalDavCredentials,
  body: string
): Promise<void> {
  const response = await fetch(resolveCalDavUrl(url), {
    method: "PUT",
    headers: {
      Authorization: createAuthHeader(credentials),
      "Content-Type": "text/calendar; charset=utf-8",
      "If-None-Match": "*",
      "User-Agent": "HELPY/1.0",
    },
    body,
    cache: "no-store",
    redirect: "follow",
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("CALDAV_AUTH_FAILED");
  }

  if (!response.ok && response.status !== 201 && response.status !== 204) {
    throw new Error(`CALDAV_PUT_FAILED_${response.status}`);
  }
}

function buildICalEvent(input: AppleCalDavCreateEventInput): string {
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
  const description = (input.description ?? "Erstellt von HELPY").replace(/\n/g, "\\n");
  const location = input.location ?? "";

  const payload = {
    uid: input.uid,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    dtStart: `DTSTART;TZID=${ZURICH_TIMEZONE}:${dtStart}`,
    dtEnd: `DTEND;TZID=${ZURICH_TIMEZONE}:${dtEnd}`,
  };

  console.log("[HELPY Termin] Erkannte Rohzeit:", input.startTime);
  console.log("[HELPY Termin] Erkannte Startzeit:", input.startTime);
  console.log("[HELPY Termin] Erkannte Endzeit:", input.endTime);
  console.log("[HELPY Termin] Zeitzone:", ZURICH_TIMEZONE);
  console.log("[HELPY Termin] Kalender Payload:", payload);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HELPY//Terminassistent//DE",
    "CALSCALE:GREGORIAN",
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
    `SUMMARY:${input.summary}`,
    location ? `LOCATION:${location}` : "",
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

function resolveEventResourceUrl(calendarId: string, uid: string): string {
  const base = calendarId.endsWith("/") ? calendarId : `${calendarId}/`;
  return `${base}${uid}.ics`;
}

async function calDavRequest(
  url: string,
  method: "PROPFIND" | "REPORT",
  credentials: CalDavCredentials,
  body: string,
  depth: "0" | "1"
): Promise<string> {
  const response = await fetch(resolveCalDavUrl(url), {
    method,
    headers: {
      Authorization: createAuthHeader(credentials),
      "Content-Type": "application/xml; charset=utf-8",
      Depth: depth,
      "User-Agent": "HELPY/1.0",
      Accept: "application/xml, text/xml, */*",
    },
    body,
    cache: "no-store",
    redirect: "follow",
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("CALDAV_AUTH_FAILED");
  }

  if (!response.ok) {
    throw new Error(`CALDAV_REQUEST_FAILED_${response.status}`);
  }

  return response.text();
}

async function discoverPrincipalUrl(
  credentials: CalDavCredentials
): Promise<string> {
  const xml = await calDavRequest(
    "/",
    "PROPFIND",
    credentials,
    `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:current-user-principal />
  </d:prop>
</d:propfind>`,
    "0"
  );

  const principalBlock = xml.match(
    /<(?:[a-z]+:)?current-user-principal[^>]*>([\s\S]*?)<\/(?:[a-z]+:)?current-user-principal>/i
  )?.[1];

  const href = extractHrefFromBlock(principalBlock ?? xml);
  if (!href) {
    throw new Error("CALDAV_PRINCIPAL_NOT_FOUND");
  }

  return href;
}

async function discoverCalendarHomeUrl(
  credentials: CalDavCredentials,
  principalUrl: string
): Promise<string> {
  const xml = await calDavRequest(
    principalUrl,
    "PROPFIND",
    credentials,
    `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:cal="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <cal:calendar-home-set />
  </d:prop>
</d:propfind>`,
    "0"
  );

  const homeBlock = xml.match(
    /<(?:[a-z]+:)?calendar-home-set[^>]*>([\s\S]*?)<\/(?:[a-z]+:)?calendar-home-set>/i
  )?.[1];

  const href = extractHrefFromBlock(homeBlock ?? xml);
  if (!href) {
    throw new Error("CALDAV_HOME_NOT_FOUND");
  }

  return href;
}

function getTodayLocalRange(): { start: string; end: string; date: string } {
  return getZurichTodayWindow();
}

function getDateLocalRange(date: string): { start: string; end: string; date: string } {
  return getZurichDateWindow(date);
}

function extractCalendarDataBlocks(xml: string): string[] {
  return [
    ...xml.matchAll(/<(?:[a-z]+:)?calendar-data[^>]*>([\s\S]*?)<\/(?:[a-z]+:)?calendar-data>/gi),
  ].map((match) => decodeXmlEntities(match[1].trim()));
}

function eventOverlapsDate(event: AppleCalDavEvent, date: string): boolean {
  const startDate = event.startAt.slice(0, 10);
  const endDate = event.endAt.slice(0, 10);
  const nextDay = addDaysToZurichDate(date, 1);
  return startDate < nextDay && endDate >= date;
}

/** Server-seitiger iCloud CalDAV Client. */
export const appleCalDavServer = {
  async validateConnection(input: AppleCalendarConnectInput): Promise<boolean> {
    const credentials: CalDavCredentials = {
      appleIdEmail: input.appleIdEmail,
      appSpecificPassword: input.appSpecificPassword,
    };

    const calendars = await this.listCalendars(credentials);
    if (calendars.length === 0) {
      throw new Error("CALDAV_NO_CALENDARS");
    }

    return calendars.some((calendar) => calendar.id === input.calendarId);
  },

  async listCalendars(
    credentials: CalDavCredentials,
    calendarHomeUrl?: string
  ): Promise<AppleCalDavCalendar[]> {
    const homeUrl =
      calendarHomeUrl ??
      (await discoverCalendarHomeUrl(
        credentials,
        await discoverPrincipalUrl(credentials)
      ));

    const xml = await calDavRequest(
      homeUrl,
      "PROPFIND",
      credentials,
      `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:cal="urn:ietf:params:xml:ns:caldav" xmlns:cs="http://calendarserver.org/ns/">
  <d:prop>
    <d:displayname />
    <d:resourcetype />
    <cs:getctag />
    <cal:calendar-description />
  </d:prop>
</d:propfind>`,
      "1"
    );

    const calendars: AppleCalDavCalendar[] = [];

    for (const block of extractResponseBlocks(xml)) {
      if (!isSuccessfulResponse(block) || !isCalendarCollection(block)) continue;

      const href = extractHrefFromBlock(block);
      if (!href || isCalendarHomeCollection(href)) continue;

      const name =
        extractTagValue(block, "displayname") ??
        href.split("/").filter(Boolean).pop() ??
        "Kalender";

      if (isExcludedAppleCalendar(href, name)) continue;

      calendars.push({
        id: href,
        name,
        isPrimary:
          name.toLowerCase().includes("home") ||
          name.toLowerCase().includes("privat") ||
          name.toLowerCase().includes("zuhause"),
      });
    }

    return calendars;
  },

  async fetchEventsForCalendar(options: {
    credentials: CalDavCredentials;
    calendar: AppleCalDavCalendar;
    range?: { start: string; end: string; date: string };
  }): Promise<AppleCalDavEvent[]> {
    const range = options.range ?? getTodayLocalRange();

    const xml = await calDavRequest(
      options.calendar.id,
      "REPORT",
      options.credentials,
      `<?xml version="1.0" encoding="utf-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag />
    <c:calendar-data />
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range start="${range.start}" end="${range.end}" />
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`,
      "1"
    );

    const events: AppleCalDavEvent[] = [];

    for (const icalData of extractCalendarDataBlocks(xml)) {
      const parsedEvents = parseICalEvents(icalData);
      for (const event of parsedEvents) {
        events.push({
          uid: event.uid,
          calendarId: options.calendar.id,
          calendarName: options.calendar.name,
          summary: event.summary,
          description: event.description,
          location: event.location,
          startAt: event.startAt,
          endAt: event.endAt,
          isAllDay: event.isAllDay,
          attendees: event.attendees,
        });
      }
    }

    return events.filter((event) => eventOverlapsDate(event, range.date));
  },

  /** Lädt alle Kalender und heutige Termine (00:00–00:00 Europe/Zurich). */
  async syncTodayEvents(
    credentials: CalDavCredentials
  ): Promise<AppleCalDavSyncResult> {
    const range = getTodayLocalRange();
    const calendars = await this.listCalendars(credentials);

    if (calendars.length === 0) {
      throw new Error("CALDAV_NO_CALENDARS");
    }

    const eventMap = new Map<string, AppleCalDavEvent>();

    for (const calendar of calendars) {
      const calendarEvents = await this.fetchEventsForCalendar({
        credentials,
        calendar,
        range,
      });

      for (const event of calendarEvents) {
        eventMap.set(`${calendar.id}:${event.uid}`, event);
      }
    }

    const events = [...eventMap.values()]
      .filter((event) => eventOverlapsDate(event, range.date))
      .sort((a, b) => a.startAt.localeCompare(b.startAt));

    return { calendars, events };
  },

  /** Lädt Termine für ein bestimmtes Datum (Europe/Zurich). */
  async syncEventsForDate(
    credentials: CalDavCredentials,
    date: string
  ): Promise<AppleCalDavSyncResult> {
    const range = getDateLocalRange(date);
    const calendars = await this.listCalendars(credentials);

    if (calendars.length === 0) {
      throw new Error("CALDAV_NO_CALENDARS");
    }

    const eventMap = new Map<string, AppleCalDavEvent>();

    for (const calendar of calendars) {
      const calendarEvents = await this.fetchEventsForCalendar({
        credentials,
        calendar,
        range,
      });

      for (const event of calendarEvents) {
        eventMap.set(`${calendar.id}:${event.uid}`, event);
      }
    }

    const events = [...eventMap.values()]
      .filter((event) => eventOverlapsDate(event, range.date))
      .sort((a, b) => a.startAt.localeCompare(b.startAt));

    return { calendars, events };
  },

  async createEvent(
    credentials: CalDavCredentials,
    input: AppleCalDavCreateEventInput
  ): Promise<{ uid: string }> {
    const ical = buildICalEvent(input);
    const resourceUrl = resolveEventResourceUrl(input.calendarId, input.uid);
    await calDavPut(resourceUrl, credentials, ical);
    return { uid: input.uid };
  },
};
