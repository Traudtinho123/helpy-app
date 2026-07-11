import type { VoiceSettings } from "@/features/voice/types/voice-types";

const TWILIO_SAY_VOICE = 'voice="Polly.Marlene" language="de-DE"';
const TWILIO_GATHER_LANG = "de-DE";

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

function say(text: string): string {
  return `<Say ${TWILIO_SAY_VOICE}>${escapeXml(text)}</Say>`;
}

export function buildTwilioClosedTwiml(): string {
  return wrapResponse(`
  ${say("Vielen Dank für Ihren Anruf. Unser Telefonassistent ist derzeit ausserhalb der Geschäftszeiten. Bitte versuchen Sie es während unserer Öffnungszeiten erneut.")}
  <Hangup/>`.trim());
}

export function buildTwilioDisabledTwiml(): string {
  return wrapResponse(`
  ${say("Der Telefonassistent ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.")}
  <Hangup/>`.trim());
}

export function buildTwilioRateLimitTwiml(): string {
  return wrapResponse(`
  ${say("Entschuldigung, alle Leitungen sind derzeit belegt. Bitte versuchen Sie es in wenigen Minuten erneut.")}
  <Hangup/>`.trim());
}

/** Begrüßung + Speech-Gather (Twilio STT, de-DE). */
export function buildTwilioIncomingTwiml(input: {
  companyName: string;
  settings: Pick<VoiceSettings, "disclosureText">;
  gatherActionUrl: string;
}): string {
  const greeting = `Willkommen bei ${input.companyName}. Ich bin HELPY, Ihr KI-Assistent. Wie kann ich Ihnen helfen?`;
  const disclosure = input.settings.disclosureText?.trim();
  const opening = disclosure ? `${greeting} ${disclosure}` : greeting;

  return wrapResponse(`
  ${say(opening)}
  <Pause length="1"/>
  <Gather input="speech" language="${TWILIO_GATHER_LANG}" speechTimeout="auto" timeout="5" action="${escapeXml(input.gatherActionUrl)}" method="POST">
    ${say("Bitte schildern Sie kurz Ihr Anliegen.")}
  </Gather>
  ${say("Ich habe Sie leider nicht verstanden. Bitte rufen Sie erneut an.")}
  <Hangup/>`.trim());
}

/** HELPY-Antwort + weiteres Gather für Multi-Turn-Gespräch. */
export function buildTwilioReplyAndGatherTwiml(input: {
  reply: string;
  gatherActionUrl: string;
}): string {
  const safe = input.reply.slice(0, 900);

  return wrapResponse(`
  ${say(safe)}
  <Pause length="1"/>
  <Gather input="speech" language="${TWILIO_GATHER_LANG}" speechTimeout="auto" timeout="5" action="${escapeXml(input.gatherActionUrl)}" method="POST">
    ${say("Gibt es noch etwas, womit ich Ihnen helfen kann?")}
  </Gather>
  ${say("Vielen Dank für Ihren Anruf. Auf Wiederhören.")}
  <Hangup/>`.trim());
}

/** Keine Sprache erkannt — nochmal fragen. */
export function buildTwilioNoSpeechTwiml(input: { gatherActionUrl: string }): string {
  return wrapResponse(`
  ${say("Ich habe Sie leider nicht verstanden. Könnten Sie das bitte wiederholen?")}
  <Gather input="speech" language="${TWILIO_GATHER_LANG}" speechTimeout="auto" timeout="5" action="${escapeXml(input.gatherActionUrl)}" method="POST"/>
  ${say("Auf Wiederhören.")}
  <Hangup/>`.trim());
}

/** Abschluss nach max. Runden. */
export function buildTwilioGoodbyeTwiml(reply?: string): string {
  const lines = [
    reply?.trim(),
    "Vielen Dank für Ihren Anruf. Wir melden uns bei Ihnen. Auf Wiederhören.",
  ].filter(Boolean);

  return wrapResponse(`
  ${lines.map((line) => say(line!)).join("\n  ")}
  <Hangup/>`.trim());
}

/** Legacy: einmalige Antwort + Auflegen. */
export function buildTwilioReplyTwiml(reply: string): string {
  return buildTwilioGoodbyeTwiml(reply);
}
