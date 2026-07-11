import type { VoiceSettings } from "@/features/voice/types/voice-types";

const TWILIO_SAY_VOICE = 'voice="Polly.Marlene" language="de-DE"';
const TWILIO_GATHER_LANG = "de-DE";
const TWILIO_GATHER_TIMEOUT = "8";
const TWILIO_SPEECH_TIMEOUT = "3";

export const VOICE_EMPTY_RESULT_MESSAGES = {
  first:
    "Entschuldigung, ich habe Sie nicht verstanden. Könnten Sie das bitte wiederholen?",
  second:
    "Ich höre Sie leider nicht gut. Bitte sprechen Sie etwas lauter oder langsamer.",
  final:
    "Ich konnte Sie leider nicht verstehen. Ich notiere Ihren Anruf und jemand aus unserem Team meldet sich bei Ihnen. Auf Wiederhören.",
} as const;

export const VOICE_FAREWELL_MESSAGE =
  "Danke für Ihren Anruf. Auf Wiedersehen und einen schönen Tag!";

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

function buildGatherTag(gatherActionUrl: string): string {
  return `<Gather input="speech" language="${TWILIO_GATHER_LANG}" speechTimeout="${TWILIO_SPEECH_TIMEOUT}" timeout="${TWILIO_GATHER_TIMEOUT}" actionOnEmptyResult="true" action="${escapeXml(gatherActionUrl)}" method="POST"/>`;
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

/** Begrüßung → optional KI-Hinweis → Speech-Gather (Twilio STT, de-DE). */
export function buildTwilioIncomingTwiml(input: {
  companyName: string;
  settings: Pick<VoiceSettings, "greetingText" | "disclosureText">;
  gatherActionUrl: string;
}): string {
  const greeting =
    input.settings.greetingText?.trim() ||
    `Herzlich willkommen bei ${input.companyName}. Wie kann ich Ihnen helfen?`;
  const disclosure = input.settings.disclosureText?.trim();

  const spokenParts = [say(greeting)];
  if (disclosure) {
    spokenParts.push(say(disclosure));
  }

  return wrapResponse(`
  ${spokenParts.join("\n  ")}
  <Pause length="1"/>
  ${buildGatherTag(input.gatherActionUrl)}`.trim());
}

/** HELPY-Antwort + stilles Gather (Anrufer meldet sich bei Bedarf selbst). */
export function buildTwilioReplyAndGatherTwiml(input: {
  reply: string;
  gatherActionUrl: string;
}): string {
  const safe = input.reply.slice(0, 900);

  return wrapResponse(`
  ${say(safe)}
  <Pause length="1"/>
  ${buildGatherTag(input.gatherActionUrl)}`.trim());
}

/** Leeres SpeechResult — abwechselnde Fallback-Texte je Versuch. */
export function buildTwilioEmptySpeechTwiml(input: {
  gatherActionUrl: string;
  attempt: 1 | 2;
}): string {
  const message =
    input.attempt === 1
      ? VOICE_EMPTY_RESULT_MESSAGES.first
      : VOICE_EMPTY_RESULT_MESSAGES.second;

  return wrapResponse(`
  ${say(message)}
  ${buildGatherTag(input.gatherActionUrl)}`.trim());
}

/** Dritter leerer Versuch — Rückruf notieren und auflegen. */
export function buildTwilioMaxEmptyResultsTwiml(): string {
  return wrapResponse(`
  ${say(VOICE_EMPTY_RESULT_MESSAGES.final)}
  <Hangup/>`.trim());
}

/** Natürliches Gesprächsende. */
export function buildTwilioFarewellTwiml(
  message: string = VOICE_FAREWELL_MESSAGE
): string {
  return wrapResponse(`
  ${say(message)}
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
