"use client";

import { useSyncExternalStore } from "react";
import { mockCalendarEvents, type CalendarEvent } from "@/features/calendar/mock/mock-calendar";
import {
  getAppleCalendarEvents,
  isAppleCalendarConnected,
} from "@/features/apple-calendar/services/apple-calendar-sync";
import {
  getConnectedCalendarPlatform,
  getGoogleCalendarEventsInRange,
} from "@/features/calendar/services/calendar-platform";
import { buildHelpyTasksFromVorgaenge } from "@/features/calendar/services/calendar-vorgang-tasks";
import {
  DEFAULT_ANALYTICS_TIMEZONE,
  endOfWeekInTimezone,
  getDateKeyInTimezone,
} from "@/lib/datetime/timezone-week";
import type { DetectedAppointment } from "@/features/gmail/mock/mock-emails";

type CalendarStoreState = {
  addedEvents: CalendarEvent[];
  acceptedEmails: string[];
  dismissedEmails: string[];
};

const STORAGE_KEY = "helpy-calendar-store";

const defaultState: CalendarStoreState = {
  addedEvents: [],
  acceptedEmails: [],
  dismissedEmails: [],
};

let state: CalendarStoreState = { ...defaultState };
const listeners = new Set<() => void>();

function loadFromStorage(): CalendarStoreState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) } as CalendarStoreState;
  } catch {
    return defaultState;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function notify() {
  listeners.forEach((l) => l());
}

function initStore() {
  if (typeof window !== "undefined" && state === defaultState) {
    state = loadFromStorage();
  }
}

if (typeof window !== "undefined") {
  initStore();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  initStore();
  return state;
}

export function useCalendarStore() {
  return useSyncExternalStore(subscribe, getSnapshot, () => defaultState);
}

function getPlatformCalendarEvents(): CalendarEvent[] {
  if (typeof window === "undefined") return [];

  const platform = getConnectedCalendarPlatform();

  if (platform === "apple" || isAppleCalendarConnected()) {
    return getAppleCalendarEvents().map((event) => ({
      ...event,
      sourcePlatform: "apple" as const,
      helpyHint: event.helpyHint.includes("Apple")
        ? event.helpyHint
        : "Termin aus Apple Kalender.",
    }));
  }

  if (platform === "google") {
    return getGoogleCalendarEventsInRange();
  }

  return [];
}

function mergeHelpyTasks(platformEvents: CalendarEvent[]): CalendarEvent[] {
  const helpyTasks = buildHelpyTasksFromVorgaenge(platformEvents);
  const platformIds = new Set(platformEvents.map((e) => e.id));

  const uniqueHelpy = helpyTasks.filter((task) => {
    if (platformIds.has(task.id)) return false;
    return true;
  });

  return [...platformEvents, ...uniqueHelpy];
}

export function getAllCalendarEvents(): CalendarEvent[] {
  initStore();

  const platform = typeof window !== "undefined" ? getConnectedCalendarPlatform() : null;
  const appleConnected =
    typeof window !== "undefined" && isAppleCalendarConnected();

  if (appleConnected || platform) {
    const merged = mergeHelpyTasks([
      ...getPlatformCalendarEvents(),
      ...state.addedEvents,
    ]);
    return merged.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
  }

  const merged = mergeHelpyTasks([...mockCalendarEvents, ...state.addedEvents]);
  return merged.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
}

export function detectCalendarProviderMismatch(): boolean {
  if (typeof window === "undefined") return false;
  const platform = getConnectedCalendarPlatform();
  if (platform !== "apple" && !isAppleCalendarConnected()) return false;

  return getAllCalendarEvents().some(
    (event) =>
      event.sourcePlatform === "google" ||
      event.helpyHint.includes("Google Kalender")
  );
}

export function getEventsForDay(date: string): CalendarEvent[] {
  return getAllCalendarEvents().filter((e) => e.date === date);
}

export function getSidebarLabel(event: CalendarEvent): string {
  if (event.subtitle) {
    return `${event.title} — ${event.subtitle}`;
  }
  return event.title;
}

export function appointmentStatus(
  emailId: string
): "accepted" | "dismissed" | null {
  initStore();
  if (state.acceptedEmails.includes(emailId)) return "accepted";
  if (state.dismissedEmails.includes(emailId)) return "dismissed";
  return null;
}

export function acceptAppointmentFromEmail(
  emailId: string,
  appointment: DetectedAppointment
): CalendarEvent {
  initStore();

  const existing = state.addedEvents.find((e) => e.sourceEmailId === emailId);
  if (existing) {
    if (!state.acceptedEmails.includes(emailId)) {
      state = {
        ...state,
        acceptedEmails: [...state.acceptedEmails, emailId],
      };
      persist();
      notify();
    }
    return existing;
  }

  const newEvent: CalendarEvent = {
    id: `email-${emailId}-${Date.now()}`,
    time: appointment.time.replace(" Uhr", ""),
    title: appointment.title,
    subtitle: appointment.company,
    type: appointment.type ?? "termin",
    helpyHint: `Termin aus E-Mail übernommen — ${appointment.contact ?? appointment.company}.`,
    date: appointment.date,
    sourceEmailId: emailId,
  };

  state = {
    addedEvents: [...state.addedEvents, newEvent],
    acceptedEmails: [...state.acceptedEmails, emailId],
    dismissedEmails: state.dismissedEmails.filter((id) => id !== emailId),
  };

  persist();
  notify();
  return newEvent;
}

export function addConfirmedHelpyAppointment(event: CalendarEvent): CalendarEvent {
  initStore();

  const existingIndex = state.addedEvents.findIndex(
    (item) => item.vorgangId === event.vorgangId && item.confirmationStatus === "bestaetigt"
  );

  if (existingIndex >= 0) {
    const updated = [...state.addedEvents];
    updated[existingIndex] = event;
    state = { ...state, addedEvents: updated };
  } else {
    state = {
      ...state,
      addedEvents: [...state.addedEvents, event],
    };
  }

  persist();
  notify();
  return event;
}

export function dismissAppointment(emailId: string) {
  initStore();
  if (state.dismissedEmails.includes(emailId)) return;

  state = {
    ...state,
    dismissedEmails: [...state.dismissedEmails, emailId],
  };
  persist();
  notify();
}

export function addBlockedTimeEvent(input: {
  title: string;
  date: string;
  time: string;
  durationMinutes: number;
}): CalendarEvent {
  initStore();

  const endMinutes =
    parseInt(input.time.split(":")[0] ?? "0", 10) * 60 +
    parseInt(input.time.split(":")[1] ?? "0", 10) +
    input.durationMinutes;
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

  const newEvent: CalendarEvent = {
    id: `blocked-${Date.now()}`,
    time: input.time,
    endTime,
    title: input.title.trim() || "Blockierte Zeit",
    type: "termin",
    helpyHint: "Manuell blockierte Zeit.",
    date: input.date,
  };

  state = {
    ...state,
    addedEvents: [...state.addedEvents, newEvent],
  };
  persist();
  notify();
  return newEvent;
}

export function dateFromParts(day: number, month: number, year: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function dateFromDay(day: number, month?: number, year?: number): string {
  const now = new Date();
  return dateFromParts(day, month ?? now.getMonth(), year ?? now.getFullYear());
}

export function getTodayDateString(): string {
  const now = new Date();
  return dateFromDay(now.getDate(), now.getMonth(), now.getFullYear());
}

export function countRemainingWeekCalendarEvents(
  timeZone: string = DEFAULT_ANALYTICS_TIMEZONE
): number {
  const now = new Date();
  const todayKey = getDateKeyInTimezone(now.toISOString(), timeZone);
  const weekEndKey = getDateKeyInTimezone(
    endOfWeekInTimezone(now, timeZone).toISOString(),
    timeZone
  );

  return getAllCalendarEvents().filter(
    (event) => event.date >= todayKey && event.date <= weekEndKey
  ).length;
}

export function getTodayDayNumber(): number {
  return new Date().getDate();
}

const WEEKDAY_NAMES = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
] as const;

const MONTH_NAMES = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
] as const;

export function formatDayLabel(day: number, month?: number, year?: number): string {
  const now = new Date();
  const resolvedYear = year ?? now.getFullYear();
  const resolvedMonth = month ?? now.getMonth();
  const date = new Date(resolvedYear, resolvedMonth, day);
  return `${WEEKDAY_NAMES[date.getDay()]}, ${day}. ${MONTH_NAMES[resolvedMonth]} ${resolvedYear}`;
}

export const TODAY_DAY = getTodayDayNumber();

export function getDaysWithEventsForMonth(month: number, year: number): number[] {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const days = new Set<number>();
  getAllCalendarEvents().forEach((e) => {
    if (!e.date.startsWith(prefix)) return;
    const day = parseInt(e.date.split("-")[2], 10);
    if (!Number.isNaN(day)) days.add(day);
  });
  return [...days].sort((a, b) => a - b);
}

export function getDaysWithEvents(): number[] {
  const now = new Date();
  return getDaysWithEventsForMonth(now.getMonth(), now.getFullYear());
}

export function isSameCalendarDay(
  a: { day: number; month: number; year: number },
  b: { day: number; month: number; year: number }
): boolean {
  return a.day === b.day && a.month === b.month && a.year === b.year;
}

export function isToday(day: number, month: number, year: number): boolean {
  const now = new Date();
  return (
    day === now.getDate() &&
    month === now.getMonth() &&
    year === now.getFullYear()
  );
}
