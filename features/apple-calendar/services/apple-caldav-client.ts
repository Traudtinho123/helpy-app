import type { CalendarEvent } from "@/features/calendar/mock/mock-calendar";
import type {
  AppleCalDavCalendar,
  AppleCalendarConnectInput,
} from "@/features/apple-calendar/types/apple-calendar-types";

type ApiErrorResponse = {
  error?: string;
  connected?: boolean;
};

export type AppleTodaySyncResponse = {
  connected: true;
  calendarsFound: number;
  eventsToday: CalendarEvent[];
  lastSync: string;
};

async function postJson<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = (await response.json()) as T & ApiErrorResponse;

  if (!response.ok || payload.connected === false) {
    throw new Error(payload.error ?? "API_REQUEST_FAILED");
  }

  return payload;
}

async function postMutation<T extends { ok?: boolean; error?: string }>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = (await response.json()) as T;

  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error ?? "API_REQUEST_FAILED");
  }

  return payload;
}

/** Browser-Client — ruft ausschließlich HELPY API-Routen auf, nie iCloud direkt. */
export const appleCalDavClient = {
  async listCalendars(
    input: Pick<AppleCalendarConnectInput, "appleIdEmail" | "appSpecificPassword">
  ): Promise<AppleCalDavCalendar[]> {
    const result = await postJson<{ calendars: AppleCalDavCalendar[] }>(
      "/api/apple-calendar/calendars",
      {
        appleId: input.appleIdEmail,
        appSpecificPassword: input.appSpecificPassword,
      }
    );

    return result.calendars;
  },

  async syncTodayEvents(input: {
    appleIdEmail: string;
    appSpecificPassword: string;
  }): Promise<AppleTodaySyncResponse> {
    return postJson<AppleTodaySyncResponse>("/api/apple-calendar/today", {
      appleId: input.appleIdEmail,
      appSpecificPassword: input.appSpecificPassword,
    });
  },

  async fetchEventsForDate(input: {
    appleIdEmail: string;
    appSpecificPassword: string;
    date: string;
  }): Promise<{
    connected: true;
    date: string;
    calendarsFound: number;
    events: CalendarEvent[];
  }> {
    return postJson("/api/apple-calendar/events", {
      appleId: input.appleIdEmail,
      appSpecificPassword: input.appSpecificPassword,
      date: input.date,
    });
  },

  async createEvent(input: {
    appleIdEmail: string;
    appSpecificPassword: string;
    calendarId: string;
    uid: string;
    summary: string;
    date: string;
    startTime: string;
    endTime: string;
    location?: string;
    description?: string;
  }): Promise<{ ok: true; uid: string }> {
    return postMutation("/api/apple-calendar/create-event", {
      appleId: input.appleIdEmail,
      appSpecificPassword: input.appSpecificPassword,
      calendarId: input.calendarId,
      uid: input.uid,
      summary: input.summary,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      location: input.location,
      description: input.description,
    });
  },
};
