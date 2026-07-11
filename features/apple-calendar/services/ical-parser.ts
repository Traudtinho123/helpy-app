import { getZurichTimeParts } from "@/features/apple-calendar/services/apple-caldav-timezone";

export type ParsedICalEvent = {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  attendees: string[];
};

function utcDateToZurichIso(date: Date): string {
  const parts = getZurichTimeParts(date);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

function unfoldIcalLines(ical: string): string[] {
  const rawLines = ical.replace(/\r\n/g, "\n").split("\n");
  const lines: string[] = [];

  for (const line of rawLines) {
    if (line.startsWith(" ") || line.startsWith("\t")) {
      const previous = lines.pop() ?? "";
      lines.push(`${previous}${line.slice(1)}`);
      continue;
    }
    lines.push(line);
  }

  return lines;
}

function parseIcalProperty(line: string): {
  name: string;
  params: Record<string, string>;
  value: string;
} {
  const colonIndex = line.indexOf(":");
  const left = colonIndex >= 0 ? line.slice(0, colonIndex) : line;
  const value = colonIndex >= 0 ? line.slice(colonIndex + 1) : "";
  const parts = left.split(";");
  const name = parts[0]?.toUpperCase() ?? "";
  const params: Record<string, string> = {};

  for (const part of parts.slice(1)) {
    const [key, paramValue] = part.split("=");
    if (key && paramValue) {
      params[key.toUpperCase()] = paramValue.replace(/^"|"$/g, "");
    }
  }

  return { name, params, value };
}

function parseIcalDateTime(
  value: string,
  params: Record<string, string>
): { iso: string; isAllDay: boolean } {
  if (params.VALUE === "DATE" || /^\d{8}$/.test(value)) {
    const dateValue = value.slice(0, 8);
    const year = dateValue.slice(0, 4);
    const month = dateValue.slice(4, 6);
    const day = dateValue.slice(6, 8);
    return {
      iso: `${year}-${month}-${day}T00:00:00`,
      isAllDay: true,
    };
  }

  const normalized = value.match(/Z$/) ? value : value;
  const match = normalized.match(
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/
  );

  if (!match) {
    return { iso: new Date().toISOString().slice(0, 19), isAllDay: false };
  }

  const [, year, month, day, hour, minute, second, zulu] = match;
  const localIso = `${year}-${month}-${day}T${hour}:${minute}:${second}`;

  if (zulu) {
    const utcDate = new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      )
    );

    return { iso: utcDateToZurichIso(utcDate), isAllDay: false };
  }

  if (params.TZID) {
    return { iso: localIso, isAllDay: false };
  }

  return {
    iso: localIso,
    isAllDay: false,
  };
}

function parseAttendeeValue(value: string): string {
  const mailtoMatch = value.match(/mailto:([^;]+)/i);
  if (mailtoMatch?.[1]) return mailtoMatch[1].trim();

  const cnMatch = value.match(/CN=([^;:]+)/i);
  if (cnMatch?.[1]) return cnMatch[1].trim();

  return value.trim();
}

function parseVEventBlock(blockLines: string[]): ParsedICalEvent | null {
  let uid = "";
  let summary = "Termin";
  let description: string | undefined;
  let location: string | undefined;
  let startAt = "";
  let endAt = "";
  let isAllDay = false;
  const attendees: string[] = [];

  for (const line of blockLines) {
    const { name, params, value } = parseIcalProperty(line);

    switch (name) {
      case "UID":
        uid = value.trim();
        break;
      case "SUMMARY":
        summary = value.trim() || summary;
        break;
      case "DESCRIPTION":
        description = value.trim().replace(/\\n/g, " ");
        break;
      case "LOCATION":
        location = value.trim().replace(/\\n/g, " ");
        break;
      case "DTSTART": {
        const parsed = parseIcalDateTime(value.trim(), params);
        startAt = parsed.iso;
        isAllDay = parsed.isAllDay;
        break;
      }
      case "DTEND": {
        const parsed = parseIcalDateTime(value.trim(), params);
        endAt = parsed.iso;
        break;
      }
      case "ATTENDEE":
        attendees.push(parseAttendeeValue(value));
        break;
      default:
        break;
    }
  }

  if (!uid || !startAt) return null;
  if (!endAt) endAt = startAt;

  return {
    uid,
    summary,
    description,
    location,
    startAt,
    endAt,
    isAllDay,
    attendees,
  };
}

/** Parst VEVENT-Blöcke aus iCalendar calendar-data. */
export function parseICalEvents(icalData: string): ParsedICalEvent[] {
  const lines = unfoldIcalLines(icalData);
  const events: ParsedICalEvent[] = [];
  let inEvent = false;
  let currentBlock: string[] = [];

  for (const line of lines) {
    if (line.toUpperCase() === "BEGIN:VEVENT") {
      inEvent = true;
      currentBlock = [];
      continue;
    }

    if (line.toUpperCase() === "END:VEVENT") {
      if (inEvent) {
        const parsed = parseVEventBlock(currentBlock);
        if (parsed) events.push(parsed);
      }
      inEvent = false;
      currentBlock = [];
      continue;
    }

    if (inEvent) {
      currentBlock.push(line);
    }
  }

  return events;
}
