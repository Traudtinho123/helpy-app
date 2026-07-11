import type { CalendarEvent } from "@/features/calendar/mock/mock-calendar";

/** Rohdaten eines iCloud-Kalenders (CalDAV). */
export type AppleCalDavCalendar = {
  id: string;
  name: string;
  color?: string;
  isPrimary?: boolean;
};

/** Rohdaten eines iCloud-Termins (CalDAV VEVENT). */
export type AppleCalDavEvent = {
  uid: string;
  calendarId: string;
  calendarName?: string;
  summary: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt: string;
  isAllDay: boolean;
  attendees?: string[];
};

/** Verbindungskonfiguration — kein Passwort wird gespeichert. */
export type AppleCalendarConnectInput = {
  appleIdEmail: string;
  /** Nur für Mock-Validierung während der Sitzung, wird nicht persistiert. */
  appSpecificPassword: string;
  calendarId: string;
};

export type AppleCalendarConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "syncing"
  | "error";

/** Persistierte Verbindungsmetadaten (ohne Passwort). */
export type AppleCalendarConnection = {
  status: AppleCalendarConnectionStatus;
  appleIdEmail: string | null;
  calendarId: string | null;
  calendarName: string | null;
  connectedAt: string | null;
  lastSyncAt: string | null;
  errorMessage: string | null;
};

export type AppleCalendarSyncState = {
  connection: AppleCalendarConnection;
  events: CalendarEvent[];
  calendarsFound: number;
};

export const APPLE_CALENDAR_PROVIDER_ID = "apple-calendar" as const;
