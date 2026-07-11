export type {
  ProviderAudioPayload,
  ProviderCallHandle,
  VoiceProviderAdapter,
} from "@/features/voice/voice-provider/types";

export { mockVoiceProvider } from "@/features/voice/voice-provider/mock-provider";
export { twilioVoiceProviderStub } from "@/features/voice/voice-provider/twilio-provider.stub";
export {
  getActiveVoiceProvider,
  getVoiceProviderById,
  listVoiceProviders,
  setActiveVoiceProviderId,
} from "@/features/voice/voice-provider/provider-registry";
