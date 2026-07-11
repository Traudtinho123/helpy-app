import {
  disconnectAppleCalendar,
  getAppleCalendarSyncState,
  isAppleCalendarConnected,
} from "@/features/apple-calendar/services/apple-calendar-sync";
import type { CalendarEvent } from "@/features/calendar/mock/mock-calendar";
import {
  connectAppleCalendarIntegration,
  getIntegrationById,
  runIntegrationAction,
  subscribeIntegrations,
} from "@/features/integration-manager/services/integration-manager";

export type CalendarPlatform = "google" | "apple";

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Aktive Kalender-Plattform — Google und Apple schließen sich gegenseitig aus. */
export function getConnectedCalendarPlatform(): CalendarPlatform | null {
  if (typeof window !== "undefined" && isAppleCalendarConnected()) {
    return "apple";
  }

  const apple = getIntegrationById("apple-calendar");
  if (apple?.connected) return "apple";

  const google = getIntegrationById("google-calendar");
  if (google?.connected) return "google";

  return null;
}

export function subscribeCalendarPlatform(listener: () => void): () => void {
  return subscribeIntegrations(listener);
}

function disconnectGoogleCalendarIntegration(): void {
  const google = getIntegrationById("google-calendar");
  if (google?.connected) {
    runIntegrationAction("google-calendar", "disconnect");
  }
}

function disconnectAppleCalendarIntegration(): void {
  const apple = getIntegrationById("apple-calendar");
  if (apple?.connected) {
    runIntegrationAction("apple-calendar", "disconnect");
  }
  disconnectAppleCalendar();
}

/** Google Kalender verbinden — trennt Apple automatisch. */
export function connectGoogleCalendarPlatform(): void {
  disconnectAppleCalendarIntegration();
  runIntegrationAction("google-calendar", "connect");
}

/** Apple Kalender verbinden — trennt Google automatisch. */
export function connectAppleCalendarPlatform(options: {
  accountEmail: string;
  calendarName: string;
  eventsToday: number;
}): void {
  disconnectGoogleCalendarIntegration();
  connectAppleCalendarIntegration(options);
}

/** Trennt die aktive Kalender-Plattform. */
export function disconnectCalendarPlatform(platform: CalendarPlatform): void {
  if (platform === "google") {
    disconnectGoogleCalendarIntegration();
    return;
  }
  disconnectAppleCalendarIntegration();
}

/** Stimmt Integrations-Status mit gespeicherter Apple-Verbindung ab. */
export function reconcileCalendarPlatformState(): void {
  if (typeof window === "undefined") return;
  if (!isAppleCalendarConnected()) return;

  const state = getAppleCalendarSyncState();
  if (!state.connection.appleIdEmail) return;

  connectAppleCalendarPlatform({
    accountEmail: state.connection.appleIdEmail,
    calendarName: state.connection.calendarName ?? "Apple Kalender",
    eventsToday: state.events.length,
  });
}

/** Mock-Termine für Google Kalender — pro Datum deterministisch. */
export function getGoogleCalendarEventsForDate(date: string): CalendarEvent[] {
  const today = formatLocalDate(new Date());
  if (date === today) {
    return getGoogleCalendarEventsForToday();
  }

  const day = Number(date.split("-")[2] ?? 0);
  if (day % 2 === 0) {
    return [
      {
        id: `google-${date}-1`,
        time: "10:00",
        endTime: "11:00",
        title: "Team-Meeting",
        subtitle: "Intern",
        type: "termin",
        helpyHint: "Termin aus Google Kalender.",
        date,
      },
      {
        id: `google-${date}-2`,
        time: "15:00",
        endTime: "16:00",
        title: "Kundengespräch",
        subtitle: "Intern",
        type: "termin",
        helpyHint: "Termin aus Google Kalender.",
        date,
      },
    ];
  }

  return [
    {
      id: `google-${date}-1`,
      time: "09:30",
      endTime: "10:30",
      title: "Projektbesprechung",
      subtitle: "Intern",
      type: "termin",
      helpyHint: "Termin aus Google Kalender.",
      date,
    },
  ];
}

/** Mock-Termine für Google Kalender — nur für heute. */
export function getGoogleCalendarEventsForToday(): CalendarEvent[] {
  const today = formatLocalDate(new Date());

  return [
    {
      id: "google-today-1",
      time: "09:00",
      title: "Angebot fertigstellen",
      subtitle: "Weber & Co. GmbH",
      type: "angebot",
      helpyHint: "Termin aus Google Kalender.",
      date: today,
    },
    {
      id: "google-today-2",
      time: "10:30",
      title: "Telefonat",
      subtitle: "Sandra Klein",
      type: "telefonat",
      helpyHint: "Termin aus Google Kalender.",
      date: today,
    },
    {
      id: "google-today-3",
      time: "14:00",
      title: "Immobilienbesichtigung",
      subtitle: "ImmoService Richter — Projekt Nord",
      type: "besichtigung",
      helpyHint: "Termin aus Google Kalender.",
      date: today,
    },
    {
      id: "google-today-4",
      time: "16:30",
      title: "Steuerberater",
      subtitle: "Monatsbesprechung",
      type: "termin",
      helpyHint: "Termin aus Google Kalender.",
      date: today,
    },
  ];
}
