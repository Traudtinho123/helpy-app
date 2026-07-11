import type { VoiceProviderAdapter } from "@/features/voice/voice-provider/types";

/**
 * Twilio-Adapter — nur Provider-Schicht, nicht im Voice Core.
 * Echte Anbindung folgt später; der Core bleibt unverändert.
 */
export const twilioVoiceProviderStub: VoiceProviderAdapter = {
  id: "twilio",
  label: "Twilio",

  async incomingCall() {
    throw new Error("Twilio-Provider ist noch nicht aktiv. Bitte Mock-Modus verwenden.");
  },

  async outgoingCall() {
    throw new Error("Twilio-Provider ist noch nicht aktiv.");
  },

  async playAudio() {
    throw new Error("Twilio-Provider ist noch nicht aktiv.");
  },

  async recordAudio() {
    throw new Error("Twilio-Provider ist noch nicht aktiv.");
  },

  async hangup() {
    throw new Error("Twilio-Provider ist noch nicht aktiv.");
  },

  async transferCall() {
    throw new Error("Twilio-Provider ist noch nicht aktiv.");
  },
};
