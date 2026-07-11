import { buildVoiceBrainContext, generateVoiceResponse } from "@/features/voice/voice-ai";
import { processVoiceCall } from "@/features/voice/services/voice-call-processor";
import { resolveVoiceSkill } from "@/features/voice/voice-router";
import { mergeTranscript, createMessage } from "@/features/voice/voice-transcript/transcript-service";
import type {
  ConversationSession,
  VoiceConversationEndResult,
} from "@/features/voice/voice-core/types";
import type { VoiceCallRecord, VoiceProcessedCall } from "@/features/voice/types/voice-types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

/** Server-seitiger Mock-Lauf ohne Browser-Storage. */
export function runMockConversationServer(input: {
  transcript: string;
  call: VoiceCallRecord;
  skill?: HelpySkill;
  callerName?: string | null;
  callerPhone?: string | null;
  providerId?: string;
}): {
  processed: VoiceProcessedCall;
  conversation: ConversationSession;
  end: VoiceConversationEndResult;
} {
  const skill = resolveVoiceSkill(input.skill);
  const conversationId = `conv-${input.call.id}`;
  const callerText = input.transcript.trim();

  const brain = buildVoiceBrainContext({
    skill,
    callerName: input.callerName,
    callerPhone: input.callerPhone,
  });

  const { reply, intent, intentLabel } = generateVoiceResponse({
    transcript: callerText,
    brain,
    callerName: input.callerName,
  });

  const messages = [
    createMessage("helpy", "Guten Tag, Sie erreichen uns. Wie kann ich Ihnen helfen?"),
    createMessage("caller", callerText),
    createMessage("helpy", reply),
  ];

  const processed = processVoiceCall({
    call: input.call,
    transcript: callerText,
    skill,
  });

  const conversation: ConversationSession = {
    conversationId,
    callId: input.call.id,
    customerId: null,
    skill,
    language: "de-CH",
    providerId: input.providerId ?? "mock",
    startedAt: input.call.startedAt,
    endedAt: processed.call.endedAt,
    status: "completed",
    messages,
    summary: processed.call.summary,
    sentiment: "neutral",
    nextAction: processed.liste.recommendedNextStep ?? null,
    intent,
    transcript: mergeTranscript(messages),
    vorgangId: processed.vorgangId,
  };

  const end: VoiceConversationEndResult = {
    conversation,
    assistantReply: processed.assistantReply,
    vorgangId: processed.vorgangId,
    memoryId: `vm-${conversationId}`,
  };

  return { processed, conversation, end };
}
