import { appleCalDavClient } from "@/features/apple-calendar/services/apple-caldav-client";
import { getAppleCalendarCredentials } from "@/features/apple-calendar/services/apple-calendar-sync";
import {
  getAppleCalendarWriteConfig,
  loadMultiDayCalendarAvailability,
} from "@/features/calendar/services/calendar-availability-service";
import {
  buildAppointmentSchedulingPolicy,
  resolveAppointmentDurationFromPolicy,
} from "@/features/calendar/services/appointment-scheduling-policy";
import type { FreeSlot } from "@/features/calendar/services/availability-engine";
import type { CalendarPlatform } from "@/features/calendar/services/calendar-platform";
import { getConnectedCalendarPlatform } from "@/features/calendar/services/calendar-platform";
import {
  createGoogleCalendarEvent,
  getGoogleCalendarAccessToken,
} from "@/features/calendar/services/google-calendar-client";
import { addConfirmedHelpyAppointment } from "@/features/calendar/services/calendar-events-store";
import type {
  AppointmentSlot,
  AppointmentSuggestion,
} from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import {
  HELPY_APPOINTMENT_CONFIRM_SUCCESS,
  HELPY_APPOINTMENT_NO_CALENDAR,
  HELPY_APPOINTMENT_SAVE_ERROR,
  HELPY_VIEWING_SAVE_REVIEW_TITLE,
  HELPY_VIEWING_SAVE_CONFIRM_LABEL,
  HELPY_VIEWING_TIME_UNRECOGNIZED,
} from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import {
  buildViewingConfirmationFromSlot,
  detectViewingConfirmationInReply,
} from "@/features/appointment-suggestions/services/viewing-confirmation-detector";
import {
  formatGermanDateLabel,
} from "@/features/appointment-suggestions/services/viewing-date-parser";
import {
  isValidTimeString,
  logAppointmentTimeDebug,
} from "@/features/appointment-suggestions/services/viewing-time-parser";
import { hasViewingRequestSignal } from "@/features/appointment-suggestions/services/viewing-request-detector";
import { PLATFORM_INQUIRY_MISSING } from "@/features/brain/types/platform-inquiry-types";
import type { GmailConnectorMessage } from "@/features/gmail/services/gmail/types";
import { refreshReplyDraftWithAppointmentSlots } from "@/features/reply-drafts/services/reply-draft-engine";
import type { HelpyReview } from "@/features/review/services/types";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";
import { recordViewingSavedToCalendar } from "@/features/workspace/services/status";
import { processBackgroundMemoryEvent } from "@/features/memory/services/background-memory-engine";
import { linkViewingToObject } from "@/features/real-estate/object/object-service";
import { peekRealEstateObjectByVorgangId } from "@/features/real-estate/object/object-memory";
import { applyPipelineTrigger } from "@/features/crm/pipeline/pipeline-engine";

const suggestions = new Map<string, AppointmentSuggestion>();
const listeners = new Set<() => void>();
const loadingKeys = new Set<string>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function recordConfirmedAppointmentMemory(
  suggestion: AppointmentSuggestion,
  slot: AppointmentSlot,
  snippet?: string
): void {
  if (!suggestion.contactEmail) return;

  processBackgroundMemoryEvent({
    type: "termin-bestaetigt",
    vorgangId: suggestion.vorgangId,
    email: suggestion.contactEmail,
    slotLabel: slot.label,
    text: snippet,
    objectId: peekRealEstateObjectByVorgangId(suggestion.vorgangId)?.objectId ?? null,
  });
}

export function subscribeAppointmentSuggestion(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function buildHaystack(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): string {
  return [
    liste?.intent,
    liste?.intentLabel,
    liste?.typ,
    vorgang.kopfzeile?.intentLabel,
    vorgang.aufgabe.titel,
    vorgang.aufgabe.empfohleneAktion,
    vorgang.letzteEmail.inhalt,
    vorgang.letzteEmail.betreff,
    liste?.titel,
    liste?.summary,
    liste?.snippet,
    ...(liste?.detectedContext ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}

function readContextValue(
  lines: string[] | undefined,
  prefix: string
): string | null {
  if (!lines) return null;
  const line = lines.find((entry) => entry.startsWith(`${prefix}:`));
  if (!line) return null;
  const value = line.slice(prefix.length + 1).trim();
  return value && value !== PLATFORM_INQUIRY_MISSING ? value : null;
}

export function isAppointmentVorgang(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): boolean {
  const haystack = buildHaystack(vorgang, liste).toLowerCase();

  if (liste?.typ === "terminwunsch") {
    return true;
  }

  if (liste?.typ === "anfrage") {
    const besichtigung = readContextValue(liste.detectedContext, "Besichtigung");
    return (
      Boolean(besichtigung) ||
      liste.intent === "besichtigung" ||
      hasViewingRequestSignal(haystack)
    );
  }

  if (
    liste?.intent === "terminwunsch" ||
    liste?.intent === "besichtigung"
  ) {
    return true;
  }

  if (hasViewingRequestSignal(haystack)) {
    return true;
  }

  return (
    haystack.includes("terminwunsch") ||
    haystack.includes("besichtigung") ||
    haystack.includes("erstgespräch") ||
    haystack.includes("erstgespraech")
  );
}

function mapSlot(
  slot: FreeSlot,
  date: string,
  durationMinutes: number,
  calendarLabel: string,
  index: number
): AppointmentSlot {
  const dateLabel = formatGermanDateLabel(date);
  return {
    id: `slot-${date}-${index}-${slot.start}`,
    date,
    dateLabel,
    start: slot.start,
    end: slot.end,
    label: `${dateLabel} · ${slot.label}`,
    durationMinutes,
    calendarLabel,
  };
}

function buildSuggestionBase(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): Omit<
  AppointmentSuggestion,
  "slots" | "status" | "errorMessage" | "viewingConfirmation" | "confirmationStatus"
> {
  const haystack = buildHaystack(vorgang, liste);
  const policy = buildAppointmentSchedulingPolicy();
  const duration = resolveAppointmentDurationFromPolicy(haystack, policy);
  const platform = getConnectedCalendarPlatform();
  const objekt =
    readContextValue(liste?.detectedContext, "Objekt") ??
    liste?.titel ??
    vorgang.aufgabe.titel;
  const location =
    readContextValue(liste?.detectedContext, "Adresse") ??
    (vorgang.kunde.adresse !== "—" ? vorgang.kunde.adresse : null);

  return {
    id: `appointment-suggestion-${vorgang.id}`,
    vorgangId: vorgang.id,
    customer: liste?.kunde ?? vorgang.kunde.firmenname,
    title: objekt,
    objekt,
    date: "",
    location,
    durationMinutes: duration.minutes,
    durationLabel: duration.label,
    appointmentKind: duration.kind,
    calendarPlatform: platform,
    calendarLabel:
      platform === "apple"
        ? "Apple Kalender"
        : platform === "google"
          ? "Google Kalender"
          : null,
    selectedSlotId: null,
    confirmedEventId: null,
    sourceQuelle: liste?.quelle ?? vorgang.kopfzeile?.quelle ?? "Gmail",
    contactEmail:
      readContextValue(liste?.detectedContext, "E-Mail") ??
      (vorgang.kunde.email !== "—" ? vorgang.kunde.email : null),
    contactPhone:
      readContextValue(liste?.detectedContext, "Telefon") ??
      (vorgang.kunde.telefon !== "—" ? vorgang.kunde.telefon : null),
    objectId: peekRealEstateObjectByVorgangId(vorgang.id)?.objectId ?? null,
  };
}

export function getAppointmentSuggestion(
  vorgangId: string
): AppointmentSuggestion | null {
  return suggestions.get(vorgangId) ?? null;
}

export function peekAppointmentSuggestion(
  vorgangId: string
): AppointmentSuggestion | null {
  return suggestions.get(vorgangId) ?? null;
}

export async function loadAppointmentSuggestionForWorkspace(
  vorgang: WorkspaceVorgang,
  liste?: ListeVorgang
): Promise<AppointmentSuggestion | null> {
  if (!isAppointmentVorgang(vorgang, liste)) return null;

  const existing = suggestions.get(vorgang.id);
  if (existing?.status === "bestaetigt") return existing;
  if (existing?.confirmationStatus === "saved_to_calendar") return existing;

  const loadKey = vorgang.id;
  if (loadingKeys.has(loadKey)) {
    return suggestions.get(vorgang.id) ?? null;
  }

  loadingKeys.add(loadKey);

  const base = buildSuggestionBase(vorgang, liste);
  suggestions.set(vorgang.id, {
    ...base,
    slots: existing?.slots ?? [],
    selectedSlotId: existing?.selectedSlotId ?? null,
    status: "loading",
    errorMessage: null,
    viewingConfirmation: existing?.viewingConfirmation ?? null,
    confirmationStatus: existing?.confirmationStatus ?? "none",
  });
  notify();

  const platform = getConnectedCalendarPlatform();

  if (!platform) {
    const next: AppointmentSuggestion = {
      ...base,
      slots: [],
      selectedSlotId: null,
      status: "fehler",
      errorMessage: HELPY_APPOINTMENT_NO_CALENDAR,
      viewingConfirmation: null,
      confirmationStatus: "none",
    };
    suggestions.set(vorgang.id, next);
    loadingKeys.delete(loadKey);
    notify();
    return next;
  }

  const targetText = buildHaystack(vorgang, liste);
  const policy = buildAppointmentSchedulingPolicy();
  const availability = await loadMultiDayCalendarAvailability({
    targetText,
    durationMinutes: base.durationMinutes,
    maxSlots: 3,
    maxDays: 2,
    schedulingPolicy: policy,
  });

  if (availability.errorMessage && availability.slots.length === 0) {
    const next: AppointmentSuggestion = {
      ...base,
      calendarPlatform: availability.platform,
      calendarLabel: availability.platformLabel,
      date: availability.date,
      slots: [],
      selectedSlotId: null,
      status: "fehler",
      errorMessage: availability.errorMessage,
      viewingConfirmation: null,
      confirmationStatus: "none",
    };
    suggestions.set(vorgang.id, next);
    loadingKeys.delete(loadKey);
    notify();
    return next;
  }

  const calendarLabel = availability.platformLabel ?? "Kalender";
  const slots: AppointmentSlot[] = [];

  for (const [date, daySlots] of Object.entries(availability.slotsByDate)) {
    daySlots.forEach((slot, index) => {
      if (slots.length >= 3) return;
      slots.push(mapSlot(slot, date, base.durationMinutes, calendarLabel, index));
    });
  }

  const next: AppointmentSuggestion = {
    ...base,
    calendarPlatform: availability.platform,
    calendarLabel: availability.platformLabel,
    date: slots[0]?.date ?? availability.date,
    slots,
    selectedSlotId: null,
    status: slots.length > 0 ? "vorbereitet" : "fehler",
    errorMessage:
      slots.length > 0 ? null : "Keine freien Zeiten gefunden.",
    viewingConfirmation: existing?.viewingConfirmation ?? null,
    confirmationStatus: existing?.confirmationStatus ?? "none",
  };

  suggestions.set(vorgang.id, next);
  loadingKeys.delete(loadKey);
  notify();

  refreshReplyDraftWithAppointmentSlots(vorgang.id, slots);

  return next;
}

export function selectAppointmentSlot(
  vorgangId: string,
  slotId: string
): AppointmentSuggestion | null {
  const existing = suggestions.get(vorgangId);
  if (!existing) return null;

  const next = { ...existing, selectedSlotId: slotId };
  suggestions.set(vorgangId, next);
  notify();
  return next;
}

function buildCalendarEventTitle(suggestion: AppointmentSuggestion): string {
  return `Besichtigung – ${suggestion.objekt} – ${suggestion.customer}`;
}

function buildCalendarEventDescription(
  suggestion: AppointmentSuggestion,
  slot: AppointmentSlot,
  snippet: string
): string {
  const contactParts = [
    suggestion.customer,
    suggestion.contactEmail,
    suggestion.contactPhone,
  ].filter(Boolean);

  return [
    "Von HELPY vorbereitet.",
    `Quelle: ${suggestion.sourceQuelle}`,
    `Nachricht: ${snippet || "—"}`,
    `Kontakt: ${contactParts.join(", ")}`,
    `Termin: ${slot.dateLabel} · ${slot.start}–${slot.end}`,
  ].join("\n");
}

export function createReviewForAppointmentSuggestion(
  suggestion: AppointmentSuggestion,
  options?: { customerConfirmed?: boolean }
): HelpyReview {
  const isCustomerConfirmed = options?.customerConfirmed ?? false;
  const confirmation = suggestion.viewingConfirmation;

  const resolvedSlot = isCustomerConfirmed && confirmation
    ? {
        date: confirmation.date,
        dateLabel: confirmation.dateLabel,
        start: confirmation.start,
        end: confirmation.end,
      }
    : suggestion.slots.find((item) => item.id === suggestion.selectedSlotId) ??
      suggestion.slots[0];

  const timeRecognized = isCustomerConfirmed
    ? Boolean(confirmation?.timeRecognized && isValidTimeString(confirmation.start))
    : Boolean(resolvedSlot && isValidTimeString(resolvedSlot.start));

  const slotForDescription =
    suggestion.slots.find((item) => item.id === suggestion.selectedSlotId) ??
    suggestion.slots[0] ?? {
      id: "fallback",
      date: confirmation?.date ?? suggestion.date,
      dateLabel:
        confirmation?.dateLabel ?? formatGermanDateLabel(suggestion.date),
      start: confirmation?.start ?? "—",
      end: confirmation?.end ?? "—",
      label: "—",
      durationMinutes: suggestion.durationMinutes,
      calendarLabel: suggestion.calendarLabel ?? "—",
    };

  return {
    id: `review-appointment-${suggestion.vorgangId}`,
    instanceId: suggestion.vorgangId,
    actionTypeId: "besichtigung-planen",
    actionTitle: isCustomerConfirmed
      ? HELPY_VIEWING_SAVE_REVIEW_TITLE
      : "Termin bestätigen",
    title: isCustomerConfirmed
      ? HELPY_VIEWING_SAVE_REVIEW_TITLE
      : "Termin bestätigen",
    helpyHint: timeRecognized
      ? "Bitte prüfe die Termindetails, bevor du bestätigst."
      : HELPY_VIEWING_TIME_UNRECOGNIZED,
    content: {
      kind: "termin",
      kunde: suggestion.customer,
      anlass: buildCalendarEventTitle(suggestion),
      datum:
        resolvedSlot?.dateLabel ??
        formatGermanDateLabel(confirmation?.date ?? suggestion.date),
      uhrzeit:
        resolvedSlot && isValidTimeString(resolvedSlot.start)
          ? `${resolvedSlot.start}–${resolvedSlot.end}`
          : HELPY_VIEWING_TIME_UNRECOGNIZED,
      dauer: suggestion.durationLabel,
      ort: suggestion.location ?? "—",
      kalender: suggestion.calendarLabel ?? "—",
      primaryLabel: isCustomerConfirmed
        ? HELPY_VIEWING_SAVE_CONFIRM_LABEL
        : "Termin bestätigen",
      teilnehmer: suggestion.contactEmail ?? suggestion.customer,
      beschreibung: buildCalendarEventDescription(
        suggestion,
        slotForDescription,
        confirmation?.snippet ?? ""
      ),
    },
  };
}

function formatGermanDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}`;
}

async function createAppleCalendarEvent(
  suggestion: AppointmentSuggestion,
  slot: AppointmentSlot,
  snippet: string
): Promise<{ ok: true; uid: string } | { ok: false; error: string }> {
  const writeConfig = getAppleCalendarWriteConfig();
  const credentials = getAppleCalendarCredentials();

  if (!writeConfig || !credentials) {
    return { ok: false, error: HELPY_APPOINTMENT_NO_CALENDAR };
  }

  const uid = `helpy-${suggestion.vorgangId}-${Date.now()}@helpy.app`;

  try {
    const result = await appleCalDavClient.createEvent({
      appleIdEmail: credentials.appleIdEmail,
      appSpecificPassword: credentials.appSpecificPassword,
      calendarId: writeConfig.calendarId,
      uid,
      summary: buildCalendarEventTitle(suggestion),
      date: slot.date,
      startTime: slot.start,
      endTime: slot.end,
      location: suggestion.location ?? undefined,
      description: buildCalendarEventDescription(suggestion, slot, snippet),
    });

    return { ok: true, uid: result.uid };
  } catch {
    return { ok: false, error: HELPY_APPOINTMENT_SAVE_ERROR };
  }
}

async function createGoogleCalendarEventForSuggestion(
  suggestion: AppointmentSuggestion,
  slot: AppointmentSlot,
  snippet: string
): Promise<{ ok: true; uid: string } | { ok: false; error: string }> {
  const platform = getConnectedCalendarPlatform();
  if (platform !== "google") {
    return { ok: false, error: HELPY_APPOINTMENT_NO_CALENDAR };
  }

  const accessToken = await getGoogleCalendarAccessToken();
  if (!accessToken) {
    return { ok: false, error: HELPY_APPOINTMENT_NO_CALENDAR };
  }

  const result = await createGoogleCalendarEvent({
    accessToken,
    summary: buildCalendarEventTitle(suggestion),
    date: slot.date,
    startTime: slot.start,
    endTime: slot.end,
    location: suggestion.location ?? undefined,
    description: buildCalendarEventDescription(suggestion, slot, snippet),
  });

  if (!result.ok) {
    return { ok: false, error: HELPY_APPOINTMENT_SAVE_ERROR };
  }

  return { ok: true, uid: result.eventId };
}

function saveToHelpyCalendar(
  suggestion: AppointmentSuggestion,
  slot: AppointmentSlot,
  platform: CalendarPlatform,
  externalId: string
): void {
  addConfirmedHelpyAppointment({
    id: `helpy-confirmed-${suggestion.vorgangId}`,
    time: slot.start,
    endTime: slot.end,
    title: buildCalendarEventTitle(suggestion),
    subtitle: suggestion.customer,
    type: "besichtigung",
    helpyHint: HELPY_APPOINTMENT_CONFIRM_SUCCESS,
    date: slot.date,
    location: suggestion.location ?? undefined,
    calendarName: suggestion.calendarLabel ?? undefined,
    sourcePlatform: platform,
    confirmationStatus: "bestaetigt",
    vorgangId: suggestion.vorgangId,
    externalEventId: externalId,
  });
}

async function persistAppointmentToCalendar(
  suggestion: AppointmentSuggestion,
  slot: AppointmentSlot,
  snippet: string
): Promise<{ ok: true; externalId: string } | { ok: false; error: string }> {
  if (!isValidTimeString(slot.start) || !isValidTimeString(slot.end)) {
    return { ok: false, error: HELPY_VIEWING_TIME_UNRECOGNIZED };
  }

  logAppointmentTimeDebug({
    rawTime: suggestion.viewingConfirmation?.rawTime ?? slot.start,
    startTime: slot.start,
    endTime: slot.end,
    timezone: "Europe/Zurich",
    calendarPayload: {
      date: slot.date,
      startTime: slot.start,
      endTime: slot.end,
      calendar: suggestion.calendarLabel,
      platform: suggestion.calendarPlatform,
    },
  });

  const platform = suggestion.calendarPlatform;

  if (!platform) {
    return { ok: false, error: HELPY_APPOINTMENT_NO_CALENDAR };
  }

  let externalId = `helpy-local-${suggestion.vorgangId}-${Date.now()}`;

  if (platform === "apple") {
    const result = await createAppleCalendarEvent(suggestion, slot, snippet);
    if (!result.ok) return result;
    externalId = result.uid;
  } else if (platform === "google") {
    const result = await createGoogleCalendarEventForSuggestion(
      suggestion,
      slot,
      snippet
    );
    if (!result.ok) return result;
    externalId = result.uid;
  }

  saveToHelpyCalendar(suggestion, slot, platform, externalId);
  recordViewingSavedToCalendar(suggestion.vorgangId, platform);

  return { ok: true, externalId };
}

export async function confirmAppointmentSuggestion(
  vorgangId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const suggestion = suggestions.get(vorgangId);
  if (!suggestion) {
    return { ok: false, error: HELPY_APPOINTMENT_NO_CALENDAR };
  }

  const slot = suggestion.slots.find(
    (item) => item.id === suggestion.selectedSlotId
  );

  if (!slot) {
    return { ok: false, error: "Bitte wähle zuerst einen Terminvorschlag." };
  }

  const result = await persistAppointmentToCalendar(
    suggestion,
    slot,
    suggestion.viewingConfirmation?.snippet ?? ""
  );

  if (!result.ok) {
    const next = {
      ...suggestion,
      status: "fehler" as const,
      errorMessage: result.error,
    };
    suggestions.set(vorgangId, next);
    notify();
    return result;
  }

  const next: AppointmentSuggestion = {
    ...suggestion,
    status: "bestaetigt",
    confirmedEventId: result.externalId,
    errorMessage: null,
    confirmationStatus: "saved_to_calendar",
  };
  suggestions.set(vorgangId, next);
  notify();
  recordConfirmedAppointmentMemory(
    next,
    slot,
    suggestion.viewingConfirmation?.snippet ?? ""
  );
  linkViewingToObject(vorgangId, next.id);
  applyPipelineTrigger(vorgangId, "besichtigung-bestaetigt");

  return { ok: true };
}

export async function saveCustomerConfirmedViewing(
  vorgangId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const suggestion = suggestions.get(vorgangId);
  if (!suggestion?.viewingConfirmation) {
    return { ok: false, error: "Keine bestätigte Besichtigung erkannt." };
  }

  const confirmation = suggestion.viewingConfirmation;

  if (
    !confirmation.timeRecognized ||
    !isValidTimeString(confirmation.start) ||
    !isValidTimeString(confirmation.end)
  ) {
    return { ok: false, error: HELPY_VIEWING_TIME_UNRECOGNIZED };
  }

  const slot: AppointmentSlot = {
    id: `confirmed-${vorgangId}`,
    date: confirmation.date,
    dateLabel: confirmation.dateLabel,
    start: confirmation.start,
    end: confirmation.end,
    label: `${confirmation.dateLabel} · ${confirmation.start}–${confirmation.end}`,
    durationMinutes: suggestion.durationMinutes,
    calendarLabel: suggestion.calendarLabel ?? "Kalender",
  };

  const result = await persistAppointmentToCalendar(
    suggestion,
    slot,
    confirmation.snippet
  );

  if (!result.ok) {
    const next = {
      ...suggestion,
      status: "fehler" as const,
      errorMessage: result.error,
    };
    suggestions.set(vorgangId, next);
    notify();
    return result;
  }

  const next: AppointmentSuggestion = {
    ...suggestion,
    status: "bestaetigt",
    confirmedEventId: result.externalId,
    errorMessage: null,
    confirmationStatus: "saved_to_calendar",
  };
  suggestions.set(vorgangId, next);
  notify();
  recordConfirmedAppointmentMemory(next, slot, confirmation.snippet);
  linkViewingToObject(vorgangId, next.id);
  applyPipelineTrigger(vorgangId, "besichtigung-bestaetigt");

  return { ok: true };
}

/** Prüft Thread-Antworten auf Kundenbestätigung eines vorgeschlagenen Termins. */
export function processViewingConfirmationFromThreadReply(options: {
  vorgangId: string;
  threadId: string;
  replyText: string;
  vorgang: WorkspaceVorgang;
  liste?: ListeVorgang;
}): boolean {
  const existing = suggestions.get(options.vorgangId);
  if (
    existing?.confirmationStatus === "customer_confirmed" ||
    existing?.confirmationStatus === "saved_to_calendar"
  ) {
    return false;
  }

  let suggestion = existing;
  if (!suggestion) {
    return false;
  }

  const contextText = [
    readContextValue(options.liste?.detectedContext, "Besichtigung"),
    options.liste?.summary,
  ]
    .filter(Boolean)
    .join(" ");

  const detected = detectViewingConfirmationInReply(
    options.replyText,
    suggestion.slots,
    {
      contextText,
      durationMinutes: suggestion.durationMinutes,
    }
  );

  if (!detected) return false;

  const base = buildSuggestionBase(options.vorgang, options.liste);
  const viewingConfirmation = buildViewingConfirmationFromSlot(
    detected.slot,
    {
      interessent: base.customer,
      objekt: base.objekt,
      location: base.location,
      quelle: base.sourceQuelle,
      snippet: options.replyText,
      durationLabel: base.durationLabel,
      timeRecognized: detected.timeRecognized,
      rawTime: detected.rawTime,
    }
  );

  suggestion = {
    ...suggestion,
    selectedSlotId: detected.slot.id,
    viewingConfirmation,
    confirmationStatus: "customer_confirmed",
    status: "vorbereitet",
  };

  suggestions.set(options.vorgangId, suggestion);
  notify();
  return true;
}

export function processViewingConfirmationFromMessage(
  message: GmailConnectorMessage,
  vorgang: WorkspaceVorgang,
  liste: ListeVorgang
): boolean {
  if (!message.threadId || !liste.threadId) return false;
  if (message.threadId !== liste.threadId) return false;

  return processViewingConfirmationFromThreadReply({
    vorgangId: liste.id,
    threadId: message.threadId,
    replyText: `${message.subject} ${message.snippet}`,
    vorgang,
    liste,
  });
}

export {
  formatGermanDate,
};
