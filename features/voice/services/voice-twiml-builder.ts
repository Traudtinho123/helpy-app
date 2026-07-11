import { buildVoiceOpeningMessage } from "@/features/voice/services/voice-greeting";
import type { VoiceSettings } from "@/features/voice/types/voice-types";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapResponse(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n${body}\n</Response>`;
}

export function buildTwilioClosedTwiml(): string {
  return wrapResponse(`
  <Say language="de-CH">Vielen Dank für Ihren Anruf. Unser Telefonassistent ist derzeit ausserhalb der Geschäftszeiten. Bitte versuchen Sie es während unserer Öffnungszeiten erneut.</Say>
  <Hangup/>`.trim());
}

export function buildTwilioDisabledTwiml(): string {
  return wrapResponse(`
  <Say language="de-CH">Der Telefonassistent ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.</Say>
  <Hangup/>`.trim());
}

/** Begrüßung + Speech-Gather (Twilio STT, de-CH). */
export function buildTwilioIncomingTwiml(input: {
  settings: Pick<VoiceSettings, "greetingText" | "disclosureText">;
  gatherActionUrl: string;
  statusCallbackUrl: string;
}): string {
  const opening = escapeXml(buildVoiceOpeningMessage(input.settings));

  return wrapResponse(`
  <Say language="de-CH">${opening}</Say>
  <Pause length="1"/>
  <Gather input="speech" language="de-CH" speechTimeout="auto" timeout="8" action="${escapeXml(input.gatherActionUrl)}" method="POST">
    <Say language="de-CH">Bitte schildern Sie kurz Ihr Anliegen.</Say>
  </Gather>
  <Say language="de-CH">Ich habe Sie leider nicht verstanden. Auf Wiederhören.</Say>
  <Hangup/>`.trim());
}

/** TTS-Antwort + Auflegen. */
export function buildTwilioReplyTwiml(reply: string): string {
  const safe = escapeXml(reply.slice(0, 900));
  return wrapResponse(`
  <Say language="de-CH">${safe}</Say>
  <Pause length="1"/>
  <Say language="de-CH">Auf Wiederhören.</Say>
  <Hangup/>`.trim());
}

export function buildTwilioNoSpeechTwiml(): string {
  return wrapResponse(`
  <Say language="de-CH">Entschuldigung, ich konnte Sie nicht verstehen. Bitte rufen Sie erneut an.</Say>
  <Hangup/>`.trim());
}
