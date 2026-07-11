import {
  buildAssistantReply,
  detectVoiceCallClassification,
  detectVoiceIntent,
  mapVoiceClassificationToIntent,
  mapVoiceIntentToVorgangTyp,
} from "@/features/voice/services/voice-intent-engine";
import { buildVoiceCallSummary } from "@/features/voice/services/voice-summary-engine";
import {
  buildVoiceAppointmentProposal,
  enrichVoiceProcessedCallWithAppointmentProposal,
} from "@/features/voice/services/voice-appointment-proposal";
import type {
  VoiceCallClassification,
  VoiceCallRecord,
  VoiceProcessedCall,
} from "@/features/voice/types/voice-types";
import { VOICE_CALL_CLASSIFICATION_LABELS } from "@/features/voice/types/voice-types";
import type { VoiceCallAnalysis } from "@/lib/voice/openai-voice-assistant";
import { getSkillConfig } from "@/features/workspace/services/workspace/skills";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { Vorgang as ListeVorgang } from "@/features/workspace/services/vorgaenge/types";
import { buildWorkspaceVorgangFromListe } from "@/features/workspace/services/workspace/workspace-engine";

const VOICE_QUELLE = "Telefon";

function formatReceivedLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat("de-CH", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function buildVorgangTitle(
  intentLabel: string,
  callerName?: string | null,
  callerPhone?: string | null
): string {
  if (callerName?.trim()) {
    return `${intentLabel} · ${callerName.trim()}`;
  }
  if (callerPhone?.trim()) {
    return `${intentLabel} · ${callerPhone.trim()}`;
  }
  return intentLabel;
}

export function buildVoiceListeVorgang(input: {
  vorgangId: string;
  transcript: string;
  summary: string;
  callerName?: string | null;
  callerPhone?: string | null;
  skill?: HelpySkill;
  receivedAt?: string;
  classification?: VoiceCallClassification;
  objectReference?: string | null;
  requestedDateTime?: string | null;
}): ListeVorgang {
  const receivedAt = input.receivedAt ?? new Date().toISOString();
  const receivedLabel = formatReceivedLabel(receivedAt);
  const classification =
    input.classification ?? detectVoiceCallClassification(input.transcript);
  const intent = mapVoiceClassificationToIntent(classification);
  const intentResult = detectVoiceIntent(input.transcript);
  const typ = mapVoiceIntentToVorgangTyp(intent);
  const skill = input.skill ?? "real-estate";
  const skillConfig = getSkillConfig(skill);
  const kunde =
    input.callerName?.trim() ||
    (input.callerPhone?.trim() ? input.callerPhone.trim() : "Unbekannter Anrufer");

  const prioritaet =
    classification === "notfall"
      ? "hoch"
      : classification === "rueckruf_wunsch" || classification === "besichtigung_anfrage"
        ? "hoch"
        : "mittel";

  const recommendedNextStep =
    classification === "besichtigung_anfrage"
      ? input.requestedDateTime
        ? `Terminwunsch prüfen (${input.requestedDateTime}).`
        : "Besichtigungstermin bestätigen."
      : classification === "notfall"
        ? "Dringenden Notfall sofort bearbeiten."
        : "Anrufer zurückrufen oder Anliegen prüfen.";

  const preparedActions =
    classification === "besichtigung_anfrage"
      ? [
          "Terminwunsch bestätigen",
          input.objectReference ? `Objekt prüfen: ${input.objectReference}` : "Objekt klären",
        ]
      : classification === "notfall"
        ? ["Sofort zurückrufen", "Notfall dokumentieren"]
        : ["Rückruf vorbereiten", "Kundenakte prüfen"];

  return {
    id: input.vorgangId,
    typ,
    intent,
    intentLabel: VOICE_CALL_CLASSIFICATION_LABELS[classification],
    titel: buildVorgangTitle(
      VOICE_CALL_CLASSIFICATION_LABELS[classification],
      input.callerName,
      input.callerPhone
    ),
    emoji: classification === "notfall" ? "🚨" : "☎",
    kunde,
    quelle: VOICE_QUELLE,
    prioritaet,
    status: "neu",
    summary: input.summary,
    detectedContext: [
      ...intentResult.detectedKeywords,
      ...(input.objectReference ? [input.objectReference] : []),
      ...(input.requestedDateTime ? [input.requestedDateTime] : []),
    ],
    recommendedNextStep,
    preparedActions,
    helpyEmpfehlung:
      classification === "notfall"
        ? "Notfall-Anruf — bitte umgehend bearbeiten."
        : "Telefonanruf von HELPY erfasst — bitte Anliegen bestätigen.",
    helpyMessage: buildAssistantReply(intent, input.callerName ?? undefined),
    receivedAt,
    receivedLabel,
    href: `/workspace/${input.vorgangId}`,
    snippet: input.transcript.slice(0, 200),
    skill,
    skillLabel: skillConfig.label,
    helpyStatus: "Vorbereitet",
    from: input.callerPhone ?? undefined,
  };
}

export function buildVoiceWorkspaceVorgang(
  liste: ListeVorgang,
  transcript: string
) {
  const workspace = buildWorkspaceVorgangFromListe(liste);
  return {
    ...workspace,
    letzteEmail: {
      ...workspace.letzteEmail,
      inhalt: transcript,
    },
    helpy: {
      ...workspace.helpy,
      intro: "Dieser Vorgang wurde aus einem Telefonanruf vorbereitet.",
    },
  };
}

/** Verarbeitet ein abgeschlossenes Gespräch → Vorgang (Kundenakte clientseitig). */
export function processVoiceCall(input: {
  call: VoiceCallRecord;
  transcript: string;
  skill?: HelpySkill;
  classification?: VoiceCallClassification;
  callerName?: string | null;
  objectReference?: string | null;
  requestedDateTime?: string | null;
  summaryOverride?: string | null;
  analysis?: VoiceCallAnalysis | null;
}): VoiceProcessedCall {
  const classification =
    input.classification ?? detectVoiceCallClassification(input.transcript);
  const intentResult = detectVoiceIntent(input.transcript);
  const summary =
    input.summaryOverride?.trim() ||
    buildVoiceCallSummary(input.transcript, intentResult, input.callerName ?? input.call.callerName);
  const vorgangId = input.call.vorgangId ?? `voice-${input.call.id}`;
  const callerName = input.callerName ?? input.call.callerName;

  const liste = buildVoiceListeVorgang({
    vorgangId,
    transcript: input.transcript,
    summary,
    callerName,
    callerPhone: input.call.callerPhone,
    skill: input.skill,
    receivedAt: input.call.startedAt,
    classification,
    objectReference: input.objectReference,
    requestedDateTime: input.requestedDateTime,
  });

  const workspace = buildVoiceWorkspaceVorgang(liste, input.transcript);
  const assistantReply = buildAssistantReply(
    mapVoiceClassificationToIntent(classification),
    callerName ?? undefined
  );

  const completedCall: VoiceCallRecord = {
    ...input.call,
    callerName,
    vorgangId,
    summary,
    intent: mapVoiceClassificationToIntent(classification),
    status: "completed",
    transcript: input.transcript,
    endedAt: input.call.endedAt ?? new Date().toISOString(),
  };

  const analysisForProposal: VoiceCallAnalysis =
    input.analysis ?? {
      classification,
      callerName: callerName ?? null,
      objectReference: input.objectReference ?? null,
      requestedDateTime: input.requestedDateTime ?? null,
      createVorgang: true,
      summaryHint: null,
      terminDatum: null,
      terminUhrzeit: null,
      terminDauerMinuten: null,
      objekt: input.objectReference ?? null,
      objektAdresse: null,
      anruferName: callerName ?? null,
      notizen: null,
    };

  const appointmentProposal = buildVoiceAppointmentProposal({
    vorgangId,
    classification,
    analysis: analysisForProposal,
    callerPhone: input.call.callerPhone,
    transcript: input.transcript,
    summary,
  });

  let processed: VoiceProcessedCall = {
    call: completedCall,
    vorgangId,
    kundenakteId: null,
    assistantReply,
    liste,
    workspace,
    classification,
    callerName,
    objectReference: input.objectReference ?? null,
    requestedDateTime: input.requestedDateTime ?? null,
    appointmentProposal,
    createVorgang: true,
  };

  if (appointmentProposal) {
    processed = enrichVoiceProcessedCallWithAppointmentProposal(
      processed,
      appointmentProposal
    );
  }

  return processed;
}
