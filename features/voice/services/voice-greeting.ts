import {
  DEFAULT_VOICE_DISCLOSURE,
  DEFAULT_VOICE_GREETING,
  type VoiceSettings,
} from "@/features/voice/types/voice-types";

/** Vollständiger Ansagetext inkl. KI-Offenlegung (CH/EU MVP). */
export function buildVoiceOpeningMessage(settings?: Pick<
  VoiceSettings,
  "greetingText" | "disclosureText"
>): string {
  const greeting = settings?.greetingText?.trim() || DEFAULT_VOICE_GREETING;
  const disclosure = settings?.disclosureText?.trim() || DEFAULT_VOICE_DISCLOSURE;
  return `${greeting} ${disclosure}`;
}

/** TwiML-kompatible Begrüßung für Twilio-Webhook. */
export function buildTwilioGreetingTwiml(settings?: Pick<
  VoiceSettings,
  "greetingText" | "disclosureText"
>): string {
  const message = buildVoiceOpeningMessage(settings);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="de-DE">${escapeXml(message)}</Say>
  <Pause length="1"/>
  <Say language="de-DE">Bitte schildern Sie kurz Ihr Anliegen. Ich leite alles an unser Team weiter.</Say>
  <Record maxLength="120" playBeep="true" transcribe="false"/>
</Response>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
