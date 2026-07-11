import {
  buildAppointmentSchedulingPolicy,
  resolveAppointmentDurationFromPolicy,
} from "@/features/calendar/services/appointment-scheduling-policy";
import type { VoiceCallClassification } from "@/features/voice/types/voice-types";
import {
  hasCompleteVoiceAppointmentDateTime,
  isVoiceAppointmentClassification,
  type VoiceAppointmentProposal,
} from "@/features/voice/types/voice-types";
import { maskPhoneNumber } from "@/lib/voice/mask-phone";
import type { VoiceCallAnalysis } from "@/lib/voice/openai-voice-assistant";

function normalizeIsoDate(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return null;
  return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function normalizeTime(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function splitRequestedDateTime(value: string | null | undefined): {
  date: string | null;
  time: string | null;
} {
  if (!value?.trim()) return { date: null, time: null };

  const isoMatch = value.match(/(\d{4}-\d{2}-\d{2}).*?(\d{1,2}:\d{2})/);
  if (isoMatch) {
    return {
      date: normalizeIsoDate(isoMatch[1]),
      time: normalizeTime(isoMatch[2]),
    };
  }

  const deMatch = value.match(/(\d{1,2}\.\d{1,2}\.\d{4}).*?(\d{1,2}:\d{2})/);
  if (deMatch) {
    return {
      date: normalizeIsoDate(deMatch[1]),
      time: normalizeTime(deMatch[2]),
    };
  }

  return {
    date: normalizeIsoDate(value),
    time: normalizeTime(value),
  };
}

function resolveHelpyStatus(proposal: VoiceAppointmentProposal): string {
  if (proposal.calendarStatus === "confirmed") {
    return "Termin bestätigt";
  }
  if (hasCompleteVoiceAppointmentDateTime(proposal)) {
    return "Termin vorzubereiten";
  }
  return "Terminwunsch offen - Datum noch festzulegen";
}

export function buildVoiceAppointmentProposal(input: {
  vorgangId: string;
  classification: VoiceCallClassification;
  analysis: VoiceCallAnalysis | null;
  callerPhone?: string | null;
  transcript: string;
  summary?: string | null;
}): VoiceAppointmentProposal | null {
  if (!isVoiceAppointmentClassification(input.classification)) {
    return null;
  }

  const fromRequested = splitRequestedDateTime(input.analysis?.requestedDateTime);
  const terminDatum =
    normalizeIsoDate(input.analysis?.terminDatum) ?? fromRequested.date;
  const terminUhrzeit =
    normalizeTime(input.analysis?.terminUhrzeit) ?? fromRequested.time;

  const haystack = [
    input.transcript,
    input.summary,
    input.analysis?.objectReference,
    input.analysis?.notizen,
  ]
    .filter(Boolean)
    .join(" ");

  const policy = buildAppointmentSchedulingPolicy();
  const duration = resolveAppointmentDurationFromPolicy(haystack, policy);

  const callerPhone = input.callerPhone?.trim() || null;
  const anruferName =
    input.analysis?.anruferName?.trim() ||
    input.analysis?.callerName?.trim() ||
    null;

  const proposal: VoiceAppointmentProposal = {
    vorgangId: input.vorgangId,
    classification: input.classification,
    appointmentKind:
      input.classification === "besichtigung_anfrage" ? "besichtigung" : "rueckruf",
    terminDatum,
    terminUhrzeit,
    terminDauerMinuten: input.analysis?.terminDauerMinuten ?? duration.minutes,
    objekt: input.analysis?.objekt?.trim() || input.analysis?.objectReference?.trim() || null,
    objektAdresse: input.analysis?.objektAdresse?.trim() || null,
    anruferName,
    anruferNummer: callerPhone,
    anruferNummerMasked: maskPhoneNumber(callerPhone),
    notizen:
      input.analysis?.notizen?.trim() ||
      input.summary?.trim() ||
      input.transcript.slice(0, 280),
    calendarStatus: terminDatum && terminUhrzeit ? "pending" : "none",
    appleCalendarEventUid: null,
    updatedAt: new Date().toISOString(),
  };

  return proposal;
}

export function enrichVoiceProcessedCallWithAppointmentProposal(
  processed: import("@/features/voice/types/voice-types").VoiceProcessedCall,
  proposal: VoiceAppointmentProposal | null
): import("@/features/voice/types/voice-types").VoiceProcessedCall {
  if (!proposal) return processed;

  const helpyStatus = resolveHelpyStatus(proposal);
  const terminLabel =
    proposal.terminDatum && proposal.terminUhrzeit
      ? `${proposal.terminDatum} ${proposal.terminUhrzeit}`
      : null;

  const detectedContext = [
    ...(processed.liste.detectedContext ?? []),
    proposal.objekt ? `Objekt: ${proposal.objekt}` : null,
    terminLabel ? `Terminwunsch: ${terminLabel}` : null,
    `Status: ${helpyStatus}`,
  ].filter(Boolean) as string[];

  return {
    ...processed,
    appointmentProposal: proposal,
    liste: {
      ...processed.liste,
      helpyStatus,
      intentLabel: hasCompleteVoiceAppointmentDateTime(proposal)
        ? "Termin vereinbart"
        : processed.liste.intentLabel,
      detectedContext,
      recommendedNextStep: hasCompleteVoiceAppointmentDateTime(proposal)
        ? "Termin im Apple Kalender eintragen."
        : "Datum erfragen und manuell eintragen.",
      preparedActions: hasCompleteVoiceAppointmentDateTime(proposal)
        ? ["Termin im Kalender eintragen", "Anrufer zurückrufen"]
        : ["Datum beim Anrufer erfragen", "Anrufer zurückrufen"],
    },
    workspace: {
      ...processed.workspace,
      helpy: {
        ...processed.workspace.helpy,
        naechsterSchritt: hasCompleteVoiceAppointmentDateTime(proposal)
          ? "Termin im Apple Kalender eintragen."
          : "Datum erfragen und manuell eintragen.",
      },
    },
  };
}

export { resolveHelpyStatus };
