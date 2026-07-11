import type { CalendarPlatform } from "@/features/calendar/services/calendar-platform";
import type { AppointmentDurationKind } from "@/features/calendar/services/availability-engine";

export type AppointmentSuggestionStatus =
  | "loading"
  | "vorbereitet"
  | "bestaetigt"
  | "fehler";

export type AppointmentSlot = {
  id: string;
  date: string;
  dateLabel: string;
  start: string;
  end: string;
  label: string;
  durationMinutes: number;
  calendarLabel: string;
};

export type ViewingConfirmationStatus =
  | "none"
  | "customer_confirmed"
  | "saved_to_calendar";

export type ViewingConfirmation = {
  interessent: string;
  objekt: string;
  date: string;
  dateLabel: string;
  start: string;
  end: string;
  durationLabel: string;
  location: string | null;
  quelle: string;
  snippet: string;
  confirmedAt: string;
  timeRecognized: boolean;
  rawTime: string | null;
};

export type AppointmentSuggestion = {
  id: string;
  vorgangId: string;
  customer: string;
  title: string;
  objekt: string;
  date: string;
  location: string | null;
  durationMinutes: number;
  durationLabel: string;
  appointmentKind: AppointmentDurationKind;
  calendarPlatform: CalendarPlatform | null;
  calendarLabel: string | null;
  slots: AppointmentSlot[];
  selectedSlotId: string | null;
  status: AppointmentSuggestionStatus;
  errorMessage: string | null;
  confirmedEventId: string | null;
  viewingConfirmation: ViewingConfirmation | null;
  confirmationStatus: ViewingConfirmationStatus;
  sourceQuelle: string;
  contactEmail: string | null;
  contactPhone: string | null;
  objectId: string | null;
};

export const HELPY_APPOINTMENT_CARD_TITLE = "Terminvorschläge von HELPY";
export const HELPY_APPOINTMENT_CARD_INTRO =
  "Ich habe freie Zeiten in deinem Kalender gefunden.";
export const HELPY_APPOINTMENT_SELECT_LABEL = "Termin auswählen";
export const HELPY_VIEWING_CONFIRMED_TITLE = "Besichtigung bestätigt";
export const HELPY_VIEWING_SAVE_BUTTON = "Termin in Kalender speichern";
export const HELPY_VIEWING_SAVE_REVIEW_TITLE = "Besichtigung speichern";
export const HELPY_VIEWING_SAVE_CONFIRM_LABEL =
  "Bestätigen & im Kalender speichern";
export const HELPY_APPOINTMENT_CONFIRM_SUCCESS =
  "Besichtigung im Kalender gespeichert";
export const HELPY_APPOINTMENT_SAVED_PANEL =
  "Ich habe die Besichtigung vorbereitet und im Kalender gespeichert.";
export const HELPY_APPOINTMENT_NO_CALENDAR =
  "Kein Kalender verbunden.";
export const HELPY_APPOINTMENT_SAVE_ERROR =
  "Termin konnte nicht gespeichert werden. Bitte Kalenderverbindung prüfen.";
export const HELPY_APPOINTMENT_APPLE_ERROR =
  "Termin konnte nicht gespeichert werden. Bitte Kalenderverbindung prüfen.";
export const HELPY_APPOINTMENT_GOOGLE_ERROR =
  "Termin konnte nicht gespeichert werden. Bitte Kalenderverbindung prüfen.";
export const HELPY_VIEWING_TIME_UNRECOGNIZED =
  "Uhrzeit nicht eindeutig erkannt";
