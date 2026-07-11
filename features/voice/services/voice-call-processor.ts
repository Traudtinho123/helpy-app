import {
  buildAssistantReply,
  detectVoiceIntent,
  mapVoiceIntentToVorgangTyp,
} from "@/features/voice/services/voice-intent-engine";
import { buildVoiceCallSummary } from "@/features/voice/services/voice-summary-engine";
import type {
  VoiceCallRecord,
  VoiceProcessedCall,
} from "@/features/voice/types/voice-types";
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
}): ListeVorgang {
  const receivedAt = input.receivedAt ?? new Date().toISOString();
  const receivedLabel = formatReceivedLabel(receivedAt);
  const intentResult = detectVoiceIntent(input.transcript);
  const typ = mapVoiceIntentToVorgangTyp(intentResult.intent);
  const skill = input.skill ?? "real-estate";
  const skillConfig = getSkillConfig(skill);
  const kunde =
    input.callerName?.trim() ||
    (input.callerPhone?.trim() ? input.callerPhone.trim() : "Unbekannter Anrufer");

  return {
    id: input.vorgangId,
    typ,
    intent: intentResult.intent,
    intentLabel: intentResult.intentLabel,
    titel: buildVorgangTitle(intentResult.intentLabel, input.callerName, input.callerPhone),
    emoji: "☎",
    kunde,
    quelle: VOICE_QUELLE,
    prioritaet: intentResult.intent === "rueckruf" ? "hoch" : "mittel",
    status: "neu",
    summary: input.summary,
    detectedContext: intentResult.detectedKeywords,
    recommendedNextStep: "Anrufer zurückrufen oder Anliegen prüfen.",
    preparedActions: ["Rückruf vorbereiten", "Kundenakte prüfen"],
    helpyEmpfehlung: "Telefonanruf von HELPY erfasst — bitte Anliegen bestätigen.",
    helpyMessage: buildAssistantReply(intentResult.intent, input.callerName ?? undefined),
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
}): VoiceProcessedCall {
  const intentResult = detectVoiceIntent(input.transcript);
  const summary = buildVoiceCallSummary(
    input.transcript,
    intentResult,
    input.call.callerName
  );
  const vorgangId = input.call.vorgangId ?? `voice-${input.call.id}`;

  const liste = buildVoiceListeVorgang({
    vorgangId,
    transcript: input.transcript,
    summary,
    callerName: input.call.callerName,
    callerPhone: input.call.callerPhone,
    skill: input.skill,
    receivedAt: input.call.startedAt,
  });

  const workspace = buildVoiceWorkspaceVorgang(liste, input.transcript);
  const assistantReply = buildAssistantReply(
    intentResult.intent,
    input.call.callerName ?? undefined
  );

  const completedCall: VoiceCallRecord = {
    ...input.call,
    vorgangId,
    summary,
    intent: intentResult.intent,
    status: "completed",
    transcript: input.transcript,
    endedAt: input.call.endedAt ?? new Date().toISOString(),
  };

  return {
    call: completedCall,
    vorgangId,
    kundenakteId: null,
    assistantReply,
    liste,
    workspace,
  };
}
