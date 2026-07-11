import type {
  ConversationSession,
  VoiceConversationEndResult,
  VoiceTurnInput,
  VoiceTurnResult,
} from "@/features/voice/voice-core/types";
import { buildVoiceBrainContext, generateVoiceResponse } from "@/features/voice/voice-ai";
import { saveVoiceMemory } from "@/features/voice/voice-memory";
import { getActiveVoiceProvider } from "@/features/voice/voice-provider";
import { resolveVoiceSkill } from "@/features/voice/voice-router";
import {
  createMessage,
  mergeTranscript,
  speechToText,
  textToSpeech,
} from "@/features/voice/voice-transcript";
import { processVoiceCall } from "@/features/voice/services/voice-call-processor";
import type { VoiceCallRecord } from "@/features/voice/types/voice-types";
import {
  getConversationSession,
  saveConversationSession,
  upsertConversationSession,
} from "@/features/voice/voice-history/session-store";

function createConversationId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createCallId(): string {
  return `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function startIncomingConversation(input: {
  callerPhone?: string | null;
  callerName?: string | null;
  skill?: import("@/features/workspace/services/workspace/skills").HelpySkill;
  greetingText?: string;
}): Promise<ConversationSession> {
  const provider = getActiveVoiceProvider();
  const conversationId = createConversationId();
  const callId = createCallId();
  const skill = resolveVoiceSkill(input.skill);

  const handle = await provider.incomingCall({
    callerPhone: input.callerPhone,
    callerName: input.callerName,
    conversationId,
    callId,
  });

  const greeting =
    input.greetingText?.trim() ||
    "Guten Tag, Sie erreichen uns. Wie kann ich Ihnen helfen?";

  const session: ConversationSession = {
    conversationId,
    callId: handle.call.callId,
    customerId: null,
    skill,
    language: "de-CH",
    providerId: provider.id,
    startedAt: handle.call.startedAt,
    endedAt: null,
    status: "active",
    messages: [
      createMessage("helpy", greeting),
    ],
    summary: null,
    sentiment: null,
    nextAction: null,
    intent: null,
    transcript: null,
    vorgangId: null,
  };

  saveConversationSession(session);
  return session;
}

export async function processConversationTurn(
  input: VoiceTurnInput
): Promise<VoiceTurnResult> {
  const session =
    getConversationSession(input.conversationId) ??
    ({
      conversationId: input.conversationId,
      callId: createCallId(),
      customerId: null,
      skill: resolveVoiceSkill(input.skill),
      language: "de-CH",
      providerId: getActiveVoiceProvider().id,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "active",
      messages: [],
      summary: null,
      sentiment: null,
      nextAction: null,
      intent: null,
      transcript: null,
      vorgangId: null,
    } satisfies ConversationSession);

  const callerText = speechToText({ text: input.callerText });
  const brain = buildVoiceBrainContext({
    skill: session.skill,
    callerName: input.callerName ?? session.messages.find((m) => m.role === "caller")?.text ?? null,
    callerPhone: input.callerPhone,
  });

  const { reply, intent, intentLabel } = generateVoiceResponse({
    transcript: callerText,
    brain,
    callerName: input.callerName,
  });

  const updated: ConversationSession = {
    ...session,
    messages: [
      ...session.messages,
      createMessage("caller", callerText),
      createMessage("helpy", reply),
    ],
    intent,
    transcript: mergeTranscript([
      ...session.messages,
      createMessage("caller", callerText),
      createMessage("helpy", reply),
    ]),
    nextAction: intentLabel,
  };

  saveConversationSession(updated);
  textToSpeech({ text: reply });

  return {
    conversation: updated,
    assistantReply: reply,
    intent,
    intentLabel,
  };
}

export async function endConversation(input: {
  conversationId: string;
  callerPhone?: string | null;
  callerName?: string | null;
  durationSeconds?: number;
}): Promise<VoiceConversationEndResult> {
  const session = getConversationSession(input.conversationId);
  if (!session) {
    throw new Error("Conversation nicht gefunden.");
  }

  const transcript =
    session.transcript ??
    mergeTranscript(session.messages.filter((m) => m.role !== "system"));

  const callerMessages = session.messages.filter((m) => m.role === "caller");
  const lastCallerText = callerMessages[callerMessages.length - 1]?.text ?? transcript;

  const callRecord: VoiceCallRecord = {
    id: session.callId,
    companyId: "local",
    externalCallId: null,
    callerPhone: input.callerPhone ?? null,
    callerName: input.callerName ?? null,
    status: "completed",
    durationSeconds: input.durationSeconds ?? 45,
    transcript: lastCallerText,
    summary: null,
    intent: session.intent,
    vorgangId: session.vorgangId,
    startedAt: session.startedAt,
    endedAt: new Date().toISOString(),
  };

  const processed = processVoiceCall({
    call: callRecord,
    transcript: lastCallerText,
    skill: session.skill,
  });

  const memory = saveVoiceMemory({
    conversationId: session.conversationId,
    callId: session.callId,
    vorgangId: processed.vorgangId,
    skill: session.skill,
    transcript: lastCallerText,
    summary: processed.call.summary ?? "",
    intent: processed.call.intent ?? "sonstiges",
    intentLabel: processed.liste.intentLabel ?? "Anfrage",
    callerName: input.callerName,
    callerPhone: input.callerPhone,
    nextAction: processed.liste.recommendedNextStep ?? null,
  });

  const completed: ConversationSession = {
    ...session,
    status: "completed",
    endedAt: new Date().toISOString(),
    summary: processed.call.summary,
    sentiment: memory.sentiment,
    nextAction: memory.nextStep,
    vorgangId: processed.vorgangId,
    transcript: lastCallerText,
  };

  saveConversationSession(completed);

  return {
    conversation: completed,
    assistantReply: processed.assistantReply,
    vorgangId: processed.vorgangId,
    memoryId: memory.memoryId,
  };
}

export async function runMockConversation(input: {
  transcript: string;
  callerPhone?: string | null;
  callerName?: string | null;
  skill?: import("@/features/workspace/services/workspace/skills").HelpySkill;
  greetingText?: string;
  durationSeconds?: number;
}): Promise<{
  turn: VoiceTurnResult;
  end: VoiceConversationEndResult;
  processed: ReturnType<typeof processVoiceCall>;
}> {
  const session = await startIncomingConversation({
    callerPhone: input.callerPhone,
    callerName: input.callerName,
    skill: input.skill,
    greetingText: input.greetingText,
  });

  const turn = await processConversationTurn({
    conversationId: session.conversationId,
    callerText: input.transcript,
    callerName: input.callerName,
    callerPhone: input.callerPhone,
    skill: input.skill,
  });

  const end = await endConversation({
    conversationId: session.conversationId,
    callerPhone: input.callerPhone,
    callerName: input.callerName,
    durationSeconds: input.durationSeconds,
  });

  const callRecord: VoiceCallRecord = {
    id: session.callId,
    companyId: "local",
    externalCallId: null,
    callerPhone: input.callerPhone ?? null,
    callerName: input.callerName ?? null,
    status: "completed",
    durationSeconds: input.durationSeconds ?? 45,
    transcript: input.transcript,
    summary: end.conversation.summary,
    intent: turn.intent,
    vorgangId: end.vorgangId,
    startedAt: session.startedAt,
    endedAt: end.conversation.endedAt,
  };

  const processed = processVoiceCall({
    call: callRecord,
    transcript: input.transcript,
    skill: session.skill,
  });

  return { turn, end, processed };
}

export { upsertConversationSession };
