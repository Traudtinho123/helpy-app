import type { VoiceProviderAdapter } from "@/features/voice/voice-provider/types";
import type { VoiceCall } from "@/features/voice/voice-core/types";

let mockCallCounter = 0;

function buildCall(input: {
  callId: string;
  conversationId: string;
  callerPhone?: string | null;
  callerName?: string | null;
}): VoiceCall {
  return {
    callId: input.callId,
    conversationId: input.conversationId,
    callerPhone: input.callerPhone ?? null,
    callerName: input.callerName ?? null,
    status: "active",
    startedAt: new Date().toISOString(),
    endedAt: null,
    durationSeconds: null,
  };
}

/** Entwicklungs-Provider — kein echter Telefonanschluss nötig. */
export const mockVoiceProvider: VoiceProviderAdapter = {
  id: "mock",
  label: "Mock (Entwicklung)",

  async incomingCall(input) {
    mockCallCounter += 1;
    const externalCallId = `mock-call-${mockCallCounter}`;
    return {
      externalCallId,
      call: buildCall(input),
    };
  },

  async outgoingCall(input) {
    mockCallCounter += 1;
    const externalCallId = `mock-out-${mockCallCounter}`;
    return {
      externalCallId,
      call: buildCall({
        callId: input.conversationId,
        conversationId: input.conversationId,
        callerPhone: input.targetPhone,
      }),
    };
  },

  async playAudio(_externalCallId, payload) {
    // Mock: Antwort wird als Text zurückgegeben (UI kann vorlesen simulieren)
    void payload;
  },

  async recordAudio(_externalCallId) {
    return { transcript: "" };
  },

  async hangup(_externalCallId) {
    // noop
  },

  async transferCall(_externalCallId, _target) {
    // noop
  },
};
