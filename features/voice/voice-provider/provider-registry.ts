import { mockVoiceProvider } from "@/features/voice/voice-provider/mock-provider";
import { twilioVoiceProviderStub } from "@/features/voice/voice-provider/twilio-provider.stub";
import type { VoiceProviderAdapter } from "@/features/voice/voice-provider/types";

const PROVIDERS: Record<string, VoiceProviderAdapter> = {
  mock: mockVoiceProvider,
  twilio: twilioVoiceProviderStub,
};

/** Aktiver Provider — v1: ausschließlich Mock. */
let activeProviderId = "mock";

export function getActiveVoiceProvider(): VoiceProviderAdapter {
  return PROVIDERS[activeProviderId] ?? mockVoiceProvider;
}

export function setActiveVoiceProviderId(id: string): void {
  if (!PROVIDERS[id]) return;
  activeProviderId = id;
}

export function listVoiceProviders(): VoiceProviderAdapter[] {
  return Object.values(PROVIDERS);
}

export function getVoiceProviderById(id: string): VoiceProviderAdapter | null {
  return PROVIDERS[id] ?? null;
}
