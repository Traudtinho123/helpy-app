import {
  getAppointmentSuggestion,
  isAppointmentVorgang,
  loadAppointmentSuggestionForWorkspace,
  selectAppointmentSlot,
} from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import { parseViewingTargetDate } from "@/features/appointment-suggestions/services/viewing-date-parser";
import {
  formatParsedTime,
  parseGermanTime,
} from "@/features/appointment-suggestions/services/viewing-time-parser";
import type {
  AppointmentSlot,
  AppointmentSuggestion,
} from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import type { VoiceIntent, VoiceProcessedCall } from "@/features/voice/types/voice-types";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import type { Vorgang as WorkspaceVorgang } from "@/features/workspace/services/workspace/types";

export function isVoiceAppointmentIntent(intent: VoiceIntent): boolean {
  return intent === "besichtigung" || intent === "terminwunsch";
}

export function buildVoiceAppointmentAssistantReply(input: {
  intent: VoiceIntent;
  callerName?: string | null;
  suggestion: AppointmentSuggestion | null;
}): string {
  const name = input.callerName?.trim();
  const prefix = name ? `Vielen Dank, ${name}. ` : "Vielen Dank. ";

  if (!isVoiceAppointmentIntent(input.intent)) {
    return "";
  }

  const suggestion = input.suggestion;

  if (!suggestion) {
    return `${prefix}Ihr Terminwunsch ist erfasst. Wir prüfen die Verfügbarkeit und melden uns zurück.`;
  }

  if (suggestion.status === "fehler" || suggestion.slots.length === 0) {
    if (suggestion.errorMessage?.includes("Kein Kalender")) {
      return `${prefix}Ihr Terminwunsch ist notiert. Unser Team meldet sich mit einem Terminvorschlag.`;
    }
    return `${prefix}Aktuell sind leider keine freien Termine verfügbar. Wir melden uns zeitnah bei Ihnen.`;
  }

  const slotLabels = suggestion.slots.slice(0, 3).map((slot) => slot.label);
  const options = slotLabels.join(", ");

  if (input.intent === "besichtigung") {
    return `${prefix}Gerne. Folgende Besichtigungstermine wären frei: ${options}. Passt einer davon für Sie?`;
  }

  return `${prefix}Ich habe folgende freie Termine gefunden: ${options}. Welcher passt Ihnen am besten?`;
}

function slotMatchesTranscript(slot: AppointmentSlot, transcript: string): boolean {
  const targetDate = parseViewingTargetDate(transcript);
  const parsedTime = parseGermanTime(transcript);

  const dateMatches = !targetDate || slot.date === targetDate;
  if (!dateMatches) return false;

  if (!parsedTime) return true;

  const requested = formatParsedTime(parsedTime);
  return slot.start === requested || slot.start.startsWith(`${parsedTime.hour}:`);
}

/** Wählt den passendsten Slot basierend auf Transkript (z. B. „morgen um 14 Uhr“). */
export function pickVoiceAppointmentSlot(
  slots: AppointmentSlot[],
  transcript: string
): AppointmentSlot | null {
  if (slots.length === 0) return null;

  const matched = slots.find((slot) => slotMatchesTranscript(slot, transcript));
  return matched ?? slots[0];
}

export async function loadVoiceAppointmentSuggestions(input: {
  workspace: WorkspaceVorgang;
  liste: ListeVorgang;
  transcript: string;
}): Promise<AppointmentSuggestion | null> {
  if (!isAppointmentVorgang(input.workspace, input.liste)) {
    return null;
  }

  const suggestion = await loadAppointmentSuggestionForWorkspace(
    input.workspace,
    input.liste
  );

  if (!suggestion || suggestion.slots.length === 0) {
    return suggestion;
  }

  const preferred = pickVoiceAppointmentSlot(suggestion.slots, input.transcript);
  if (preferred) {
    selectAppointmentSlot(input.liste.id, preferred.id);
  }

  return getAppointmentSuggestion(input.liste.id) ?? suggestion;
}

export function enrichVoiceListeForAppointment(
  liste: ListeVorgang,
  suggestion: AppointmentSuggestion | null
): ListeVorgang {
  if (!suggestion || suggestion.slots.length === 0) {
    return {
      ...liste,
      recommendedNextStep:
        suggestion?.errorMessage?.includes("Kein Kalender")
          ? "Kalender verbinden, dann Terminvorschlag prüfen."
          : "Terminwunsch prüfen oder Anrufer zurückrufen.",
      preparedActions: ["Termin prüfen", "Kundenakte prüfen"],
    };
  }

  const selected =
    suggestion.slots.find((slot) => slot.id === suggestion.selectedSlotId) ??
    suggestion.slots[0];

  return {
    ...liste,
    recommendedNextStep: `Terminvorschlag prüfen: ${selected.label}`,
    preparedActions: ["Termin bestätigen", "Kundenakte prüfen"],
    helpyMessage: buildVoiceAppointmentAssistantReply({
      intent: (liste.intent as VoiceIntent) ?? "terminwunsch",
      suggestion,
    }),
    detectedContext: [
      ...(liste.detectedContext ?? []),
      `Termin: ${selected.label}`,
      suggestion.calendarLabel
        ? `Kalender: ${suggestion.calendarLabel}`
        : "Kalender: —",
    ],
  };
}

/** Lädt Kalender-Slots und reichert den Telefon-Vorgang an (Phase 2). */
export async function finalizeVoiceIntakeWithCalendar(
  result: VoiceProcessedCall,
  transcript: string
): Promise<VoiceProcessedCall> {
  const intent = result.liste.intent as VoiceIntent;
  if (!isVoiceAppointmentIntent(intent)) {
    return result;
  }

  const suggestion = await loadVoiceAppointmentSuggestions({
    workspace: result.workspace,
    liste: result.liste,
    transcript,
  });

  const liste = enrichVoiceListeForAppointment(result.liste, suggestion);
  const appointmentReply = buildVoiceAppointmentAssistantReply({
    intent,
    callerName: result.call.callerName,
    suggestion,
  });

  return {
    ...result,
    liste,
    workspace: {
      ...result.workspace,
      helpy: {
        ...result.workspace.helpy,
        intro: "Telefonanruf mit Terminwunsch — HELPY hat freie Zeiten geprüft.",
        naechsterSchritt: liste.recommendedNextStep ?? result.workspace.helpy.naechsterSchritt,
      },
      letzteEmail: {
        ...result.workspace.letzteEmail,
        zusammenfassung: liste.summary ?? result.workspace.letzteEmail.zusammenfassung,
      },
    },
    assistantReply: appointmentReply || result.assistantReply,
    call: {
      ...result.call,
      summary: appointmentReply
        ? `${result.call.summary ?? ""} Antwort: ${appointmentReply}`
        : result.call.summary,
    },
  };
}
