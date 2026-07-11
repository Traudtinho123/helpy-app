import { appleCalDavClient } from "@/features/apple-calendar/services/apple-caldav-client";
import { updateAppleCalendarSyncMeta } from "@/features/integration-manager/services/integration-manager";
import type {
  AppleCalendarConnectInput,
  AppleCalendarConnection,
  AppleCalendarSyncState,
} from "@/features/apple-calendar/types/apple-calendar-types";
import type { CalendarEvent } from "@/features/calendar/mock/mock-calendar";

const STORAGE_KEY = "helpy-apple-calendar-connection";
const CREDENTIALS_KEY = "helpy-apple-calendar-credentials";

const defaultConnection: AppleCalendarConnection = {
  status: "disconnected",
  appleIdEmail: null,
  calendarId: null,
  calendarName: null,
  connectedAt: null,
  lastSyncAt: null,
  errorMessage: null,
};

type PersistedConnection = Pick<
  AppleCalendarConnection,
  "appleIdEmail" | "calendarId" | "calendarName" | "connectedAt" | "lastSyncAt"
>;

type SessionCredentials = {
  appleIdEmail: string;
  appSpecificPassword: string;
};

let connection: AppleCalendarConnection = { ...defaultConnection };
let sessionCredentials: SessionCredentials | null = null;
let events: CalendarEvent[] = [];
let calendarsFound = 0;
const listeners = new Set<() => void>();

const APPLE_CALENDAR_SERVER_SNAPSHOT: AppleCalendarSyncState = {
  connection: { ...defaultConnection },
  events: [],
  calendarsFound: 0,
};

let syncSnapshot: AppleCalendarSyncState = APPLE_CALENDAR_SERVER_SNAPSHOT;

function connectionEquals(
  a: AppleCalendarConnection,
  b: AppleCalendarConnection
): boolean {
  return (
    a.status === b.status &&
    a.appleIdEmail === b.appleIdEmail &&
    a.calendarId === b.calendarId &&
    a.calendarName === b.calendarName &&
    a.connectedAt === b.connectedAt &&
    a.lastSyncAt === b.lastSyncAt &&
    a.errorMessage === b.errorMessage
  );
}

function eventsEqual(a: CalendarEvent[], b: CalendarEvent[]): boolean {
  if (a.length !== b.length) return false;

  return a.every(
    (event, index) =>
      event.id === b[index]?.id &&
      event.date === b[index]?.date &&
      event.time === b[index]?.time &&
      event.title === b[index]?.title
  );
}

function recomputeSyncSnapshot(): void {
  const nextConnection = { ...connection };
  const nextEvents = [...events];
  const current = syncSnapshot;

  if (
    current.calendarsFound === calendarsFound &&
    connectionEquals(current.connection, nextConnection) &&
    eventsEqual(current.events, nextEvents)
  ) {
    return;
  }

  syncSnapshot = {
    connection: nextConnection,
    events: nextEvents,
    calendarsFound,
  };
}

function notify(): void {
  recomputeSyncSnapshot();
  listeners.forEach((listener) => listener());
}

function loadFromStorage(): void {
  if (typeof window === "undefined") return;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as PersistedConnection;
    connection = {
      status: "connected",
      appleIdEmail: parsed.appleIdEmail,
      calendarId: parsed.calendarId,
      calendarName: parsed.calendarName,
      connectedAt: parsed.connectedAt,
      lastSyncAt: parsed.lastSyncAt,
      errorMessage: null,
    };

    const credentialsRaw = sessionStorage.getItem(CREDENTIALS_KEY);
    if (credentialsRaw) {
      sessionCredentials = JSON.parse(credentialsRaw) as SessionCredentials;
    }
  } catch {
    connection = { ...defaultConnection };
    sessionCredentials = null;
  }
}

function persistConnection(): void {
  if (typeof window === "undefined") return;
  if (connection.status !== "connected" || !connection.appleIdEmail) {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(CREDENTIALS_KEY);
    return;
  }

  const payload: PersistedConnection = {
    appleIdEmail: connection.appleIdEmail,
    calendarId: connection.calendarId,
    calendarName: connection.calendarName,
    connectedAt: connection.connectedAt,
    lastSyncAt: connection.lastSyncAt,
  };

  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function persistCredentials(credentials: SessionCredentials): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  sessionCredentials = credentials;
}

function clearCredentials(): void {
  sessionCredentials = null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(CREDENTIALS_KEY);
  }
}

function getCredentials(): SessionCredentials | null {
  if (sessionCredentials) return sessionCredentials;
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(CREDENTIALS_KEY);
    if (!raw) return null;
    sessionCredentials = JSON.parse(raw) as SessionCredentials;
    return sessionCredentials;
  } catch {
    return null;
  }
}

function initStore(): void {
  if (typeof window !== "undefined" && connection.status === "disconnected") {
    loadFromStorage();
  }
}

if (typeof window !== "undefined") {
  initStore();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): AppleCalendarSyncState {
  initStore();
  recomputeSyncSnapshot();
  return syncSnapshot;
}

export function getAppleCalendarServerSnapshot(): AppleCalendarSyncState {
  return APPLE_CALENDAR_SERVER_SNAPSHOT;
}

export function subscribeAppleCalendarSync(listener: () => void): () => void {
  return subscribe(listener);
}

export function getAppleCalendarSyncState(): AppleCalendarSyncState {
  return getSnapshot();
}

export function isAppleCalendarConnected(): boolean {
  initStore();
  return connection.status === "connected" || connection.status === "syncing";
}

export function getAppleCalendarConnection(): AppleCalendarConnection {
  initStore();
  return { ...connection };
}

export function getAppleCalendarCredentials(): SessionCredentials | null {
  initStore();
  return getCredentials();
}

export function getAppleCalendarEvents(): CalendarEvent[] {
  initStore();
  return [...events];
}

export function getAppleCalendarEventsForDate(date: string): CalendarEvent[] {
  return getAppleCalendarEvents().filter((event) => event.date === date);
}

export function getAppleCalendarCalendarsFound(): number {
  initStore();
  return calendarsFound;
}

function mapSyncErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("Keine Apple Kalender gefunden")) {
    return "Keine Apple Kalender gefunden.";
  }

  return "Apple Kalender konnte nicht gelesen werden. Bitte Zugang prüfen.";
}

export async function connectAppleCalendar(
  input: AppleCalendarConnectInput
): Promise<{ success: boolean; errorMessage?: string }> {
  initStore();

  connection = {
    ...connection,
    status: "connecting",
    errorMessage: null,
  };
  notify();

  try {
    persistCredentials({
      appleIdEmail: input.appleIdEmail,
      appSpecificPassword: input.appSpecificPassword,
    });

    const calendars = await appleCalDavClient.listCalendars({
      appleIdEmail: input.appleIdEmail,
      appSpecificPassword: input.appSpecificPassword,
    });

    if (calendars.length === 0) {
      throw new Error("Keine Apple Kalender gefunden.");
    }

    const selectedCalendar =
      calendars.find((calendar) => calendar.id === input.calendarId) ??
      calendars.find((calendar) => calendar.isPrimary) ??
      calendars[0];

    if (!selectedCalendar) {
      throw new Error("Keine Apple Kalender gefunden.");
    }

    const now = new Date().toISOString();

    connection = {
      status: "connected",
      appleIdEmail: input.appleIdEmail,
      calendarId: selectedCalendar.id,
      calendarName: selectedCalendar.name,
      connectedAt: now,
      lastSyncAt: null,
      errorMessage: null,
    };

    persistConnection();
    notify();

    await syncAppleCalendarEvents();

    return { success: true };
  } catch (error) {
    clearCredentials();
    connection = {
      ...defaultConnection,
      status: "error",
      errorMessage: mapSyncErrorMessage(error),
    };
    notify();
    return {
      success: false,
      errorMessage: connection.errorMessage ?? undefined,
    };
  }
}

export async function syncAppleCalendarEvents(): Promise<void> {
  initStore();

  if (
    (connection.status !== "connected" && connection.status !== "syncing") ||
    !connection.appleIdEmail
  ) {
    return;
  }

  const credentials = getCredentials();
  if (!credentials) {
    connection = {
      ...connection,
      status: "error",
      errorMessage:
        "Apple Kalender konnte nicht gelesen werden. Bitte Zugang prüfen.",
    };
    notify();
    return;
  }

  connection = { ...connection, status: "syncing", errorMessage: null };
  notify();

  try {
    const result = await appleCalDavClient.syncTodayEvents({
      appleIdEmail: credentials.appleIdEmail,
      appSpecificPassword: credentials.appSpecificPassword,
    });

    calendarsFound = result.calendarsFound;
    events = result.eventsToday;
    const eventsToday = events.length;

    connection = {
      ...connection,
      status: "connected",
      lastSyncAt: result.lastSync,
      errorMessage: null,
    };
    persistConnection();

    updateAppleCalendarSyncMeta({
      accountEmail: connection.appleIdEmail ?? credentials.appleIdEmail,
      calendarName: connection.calendarName ?? "Apple Kalender",
      eventsToday,
      calendarsFound,
      lastSyncAt: connection.lastSyncAt,
    });
  } catch (error) {
    events = [];
    connection = {
      ...connection,
      status: "error",
      errorMessage: mapSyncErrorMessage(error),
    };
  }

  notify();
}

export function disconnectAppleCalendar(): void {
  connection = { ...defaultConnection };
  events = [];
  calendarsFound = 0;
  clearCredentials();

  if (typeof window !== "undefined") {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  notify();
}

export async function listAppleCalendars(input: {
  appleIdEmail: string;
  appSpecificPassword: string;
}): Promise<Awaited<ReturnType<typeof appleCalDavClient.listCalendars>>> {
  return appleCalDavClient.listCalendars(input);
}

export function formatAppleCalendarLastSync(isoDate: string | null): string {
  if (!isoDate) return "Noch nicht synchronisiert";

  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60_000));

  if (diffMinutes < 2) return "gerade eben";
  if (diffMinutes < 60) return `vor ${diffMinutes} Minuten`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `vor ${diffHours} Stunden`;

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
