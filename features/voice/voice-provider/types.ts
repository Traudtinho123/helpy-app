import type { VoiceCall } from "@/features/voice/voice-core/types";

export type ProviderCallHandle = {
  externalCallId: string;
  call: VoiceCall;
};

export type ProviderAudioPayload = {
  text: string;
  language?: string;
};

/** Austauschbare Telefonie-Schnittstelle — Core spricht nur diese API. */
export interface VoiceProviderAdapter {
  readonly id: string;
  readonly label: string;

  incomingCall(input: {
    callerPhone?: string | null;
    callerName?: string | null;
    conversationId: string;
    callId: string;
  }): Promise<ProviderCallHandle>;

  outgoingCall(input: {
    targetPhone: string;
    conversationId: string;
  }): Promise<ProviderCallHandle>;

  playAudio(externalCallId: string, payload: ProviderAudioPayload): Promise<void>;

  recordAudio(externalCallId: string): Promise<{ transcript: string }>;

  hangup(externalCallId: string): Promise<void>;

  transferCall(externalCallId: string, target: string): Promise<void>;
}
