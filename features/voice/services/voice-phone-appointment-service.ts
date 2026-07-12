import { appleCalDavClient } from "@/features/apple-calendar/services/apple-caldav-client";
import { getAppleCalendarCredentials } from "@/features/apple-calendar/services/apple-calendar-sync";
import { addMinutesToTimeString } from "@/features/appointment-suggestions/services/viewing-time-parser";
import { HELPY_APPOINTMENT_CONFIRM_SUCCESS } from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import { addConfirmedHelpyAppointment } from "@/features/calendar/services/calendar-events-store";
import { getAppleCalendarWriteConfig } from "@/features/calendar/services/calendar-availability-service";
import { resolveHelpyStatus } from "@/features/voice/services/voice-appointment-proposal";
import {
  getVoiceAppointmentProposal,
  updateVoiceAppointmentProposal,
} from "@/features/voice/services/voice-vorgaenge-store";
import {
  hasCompleteVoiceAppointmentDateTime,
  type VoiceAppointmentProposal,
} from "@/features/voice/types/voice-types";

export const VOICE_PHONE_APPOINTMENT_NO_CALENDAR =
  "Apple Kalender ist nicht verbunden. Termin wurde in HELPY Kalender gespeichert.";
export const VOICE_PHONE_APPOINTMENT_SAVE_ERROR =
  "Termin konnte nicht im Apple Kalender gespeichert werden.";
export const VOICE_PHONE_APPOINTMENT_MISSING_DATETIME =
  "Datum und Uhrzeit fehlen — Termin kann nicht eingetragen werden.";

const autoConfirmInFlight = new Set<string>();

function buildCalendarEventTitle(proposal: VoiceAppointmentProposal): string {
  if (proposal.appointmentKind === "besichtigung") {
    const objekt = proposal.objekt?.trim() || "Objekt";
    return `Besichtigung - ${objekt}`;
  }
  const name =
    proposal.anruferName?.trim() ||
    proposal.anruferNummerMasked?.trim() ||
    "Anrufer";
  return `Rückruf - ${name}`;
}

function buildCalendarEventDescription(proposal: VoiceAppointmentProposal): string {
  const lines = [
    proposal.anruferName ? `Anrufer: ${proposal.anruferName}` : null,
    proposal.anruferNummerMasked
      ? `Telefon: ${proposal.anruferNummerMasked}`
      : null,
    proposal.notizen ? `Notizen: ${proposal.notizen}` : null,
    "Erstellt von: HELPY Telefonassistent",
  ].filter(Boolean);

  return lines.join("\n");
}

function writeHelpyCalendarEntry(
  proposal: VoiceAppointmentProposal,
  vorgangId: string,
  externalEventId?: string | null,
  calendarName?: string | null
): void {
  const date = proposal.terminDatum!;
  const startTime = proposal.terminUhrzeit!;
  const endTime = addMinutesToTimeString(startTime, proposal.terminDauerMinuten);

  addConfirmedHelpyAppointment({
    id: `helpy-voice-confirmed-${vorgangId}`,
    time: startTime,
    endTime,
    title: buildCalendarEventTitle(proposal),
    subtitle: proposal.anruferName ?? proposal.anruferNummerMasked ?? undefined,
    type:
      proposal.appointmentKind === "besichtigung" ? "besichtigung" : "telefonat",
    helpyHint: HELPY_APPOINTMENT_CONFIRM_SUCCESS,
    date,
    location: proposal.objektAdresse ?? undefined,
    calendarName: calendarName ?? "HELPY Kalender",
    sourcePlatform: externalEventId ? "apple" : undefined,
    confirmationStatus: "bestaetigt",
    vorgangId,
    externalEventId: externalEventId ?? undefined,
  });
}

export function seedVoiceAppointmentProposalFromDb(
  proposal: VoiceAppointmentProposal
): void {
  updateVoiceAppointmentProposal(proposal);
}

export async function confirmVoicePhoneAppointment(
  vorgangId: string
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const proposal = getVoiceAppointmentProposal(vorgangId);
  if (!proposal) {
    return { ok: false, error: "Kein Terminvorschlag für diesen Vorgang." };
  }

  if (proposal.calendarStatus === "confirmed") {
    return { ok: true, message: HELPY_APPOINTMENT_CONFIRM_SUCCESS };
  }

  if (!hasCompleteVoiceAppointmentDateTime(proposal)) {
    return { ok: false, error: VOICE_PHONE_APPOINTMENT_MISSING_DATETIME };
  }

  const date = proposal.terminDatum!;
  const startTime = proposal.terminUhrzeit!;
  const endTime = addMinutesToTimeString(startTime, proposal.terminDauerMinuten);

  let appleUid: string | null = null;
  let calendarName: string | null = "HELPY Kalender";

  const writeConfig = getAppleCalendarWriteConfig();
  const credentials = getAppleCalendarCredentials();

  if (writeConfig && credentials) {
    const uid = `helpy-voice-${vorgangId}-${Date.now()}@helpy.app`;

    try {
      const result = await appleCalDavClient.createEvent({
        appleIdEmail: credentials.appleIdEmail,
        appSpecificPassword: credentials.appSpecificPassword,
        calendarId: writeConfig.calendarId,
        uid,
        summary: buildCalendarEventTitle(proposal),
        date,
        startTime,
        endTime,
        location: proposal.objektAdresse ?? undefined,
        description: buildCalendarEventDescription(proposal),
      });
      appleUid = result.uid;
      calendarName = writeConfig.calendarName;
    } catch {
      // Apple fehlgeschlagen — HELPY Kalender wird trotzdem befüllt.
    }
  }

  const confirmed: VoiceAppointmentProposal = {
    ...proposal,
    calendarStatus: "confirmed",
    appleCalendarEventUid: appleUid,
    updatedAt: new Date().toISOString(),
  };

  updateVoiceAppointmentProposal(confirmed);
  writeHelpyCalendarEntry(confirmed, vorgangId, appleUid, calendarName);

  return {
    ok: true,
    message: appleUid
      ? HELPY_APPOINTMENT_CONFIRM_SUCCESS
      : VOICE_PHONE_APPOINTMENT_NO_CALENDAR,
  };
}

/** Nach Telefon-Intake: Termin automatisch in HELPY (+ Apple falls verbunden) eintragen. */
export async function autoConfirmVoicePhoneAppointmentIfReady(
  vorgangId: string
): Promise<void> {
  if (typeof window === "undefined") return;
  if (autoConfirmInFlight.has(vorgangId)) return;

  const proposal = getVoiceAppointmentProposal(vorgangId);
  if (!proposal || proposal.calendarStatus === "confirmed") return;
  if (!hasCompleteVoiceAppointmentDateTime(proposal)) return;

  autoConfirmInFlight.add(vorgangId);
  try {
    await confirmVoicePhoneAppointment(vorgangId);
  } catch (error) {
    console.error("[voice] auto calendar confirm failed:", error);
  } finally {
    autoConfirmInFlight.delete(vorgangId);
  }
}

export function getVoicePhoneAppointmentHelpyStatus(
  proposal: VoiceAppointmentProposal | null
): string | null {
  if (!proposal) return null;
  return resolveHelpyStatus(proposal);
}
