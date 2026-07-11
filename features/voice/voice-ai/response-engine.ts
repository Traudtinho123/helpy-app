import {
  buildAssistantReply,
  detectVoiceIntent,
} from "@/features/voice/services/voice-intent-engine";
import { buildVoiceAppointmentAssistantReply } from "@/features/voice/services/voice-appointment-engine";
import type { VoiceBrainContext } from "@/features/voice/voice-core/types";
import type { VoiceIntent } from "@/features/voice/types/voice-types";
import type { AppointmentSuggestion } from "@/features/appointment-suggestions/types/appointment-suggestion-types";

export function generateVoiceResponse(input: {
  transcript: string;
  brain: VoiceBrainContext;
  callerName?: string | null;
  appointmentSuggestion?: AppointmentSuggestion | null;
}): { reply: string; intent: VoiceIntent; intentLabel: string } {
  const intentResult = detectVoiceIntent(input.transcript);
  const appointmentReply = buildVoiceAppointmentAssistantReply({
    intent: intentResult.intent,
    callerName: input.callerName,
    suggestion: input.appointmentSuggestion ?? null,
  });

  const baseReply = buildAssistantReply(
    intentResult.intent,
    input.callerName ?? undefined
  );

  const reply = appointmentReply || baseReply;

  void input.brain;

  return {
    reply,
    intent: intentResult.intent,
    intentLabel: intentResult.intentLabel,
  };
}
