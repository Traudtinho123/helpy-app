/** Status eines Telefonats in der Pipeline. */
export type VoiceCallStatus =
  | "ringing"
  | "in_progress"
  | "completed"
  | "failed"
  | "missed";

/** Telefonie-Provider-ID (nur Metadaten / Settings). */
export type VoiceProvider = "mock" | "simulation" | "twilio" | "telnyx" | "teams" | "sip";

/** Erkannte Anliegen-Klasse (DE). */
export type VoiceIntent =
  | "besichtigung"
  | "terminwunsch"
  | "rueckruf"
  | "angebotsanfrage"
  | "rechnung"
  | "sonstiges";

/** Post-Call Klassifikation für HELPY Phone Entscheidungslogik. */
export type VoiceCallClassification =
  | "besichtigung_anfrage"
  | "info_anfrage"
  | "rueckruf_wunsch"
  | "notfall"
  | "sonstiges";

export const VOICE_CALL_CLASSIFICATION_LABELS: Record<VoiceCallClassification, string> = {
  besichtigung_anfrage: "Besichtigungsanfrage",
  info_anfrage: "Info-Anfrage",
  rueckruf_wunsch: "Rückruf gewünscht",
  notfall: "Notfall / Dringend",
  sonstiges: "Allgemeine Anfrage",
};

export type VoiceBusinessHours = {
  /** ISO-Wochentag 1=Mo … 7=So */
  weekday: number;
  start: string;
  end: string;
};

export type VoiceSettings = {
  companyId: string;
  enabled: boolean;
  provider: VoiceProvider;
  phoneNumber: string | null;
  greetingText: string;
  disclosureText: string;
  businessHours: VoiceBusinessHours[] | null;
  updatedAt: string;
};

export type VoiceTranscriptTurn = {
  role: "caller" | "helpy";
  text: string;
  at: string;
};

export type VoiceCallRecord = {
  id: string;
  companyId: string;
  externalCallId: string | null;
  callerPhone: string | null;
  callerName: string | null;
  status: VoiceCallStatus;
  durationSeconds: number | null;
  transcript: string | null;
  summary: string | null;
  intent: VoiceIntent | null;
  vorgangId: string | null;
  transcriptTurns?: VoiceTranscriptTurn[];
  startedAt: string;
  endedAt: string | null;
  clientAckAt?: string | null;
  hasPreparedVorgang?: boolean;
  requestedDateTime?: string | null;
  classification?: VoiceCallClassification | null;
  emptyResultCount?: number;
};

export type VoiceIntentResult = {
  intent: VoiceIntent;
  intentLabel: string;
  confidence: "hoch" | "mittel" | "niedrig";
  detectedKeywords: string[];
};

export type VoiceProcessedCall = {
  call: VoiceCallRecord;
  vorgangId: string;
  kundenakteId: string | null;
  assistantReply: string;
  liste: import("@/features/workspace/services/vorgaenge/types").Vorgang;
  workspace: import("@/features/workspace/services/workspace/types").Vorgang;
  classification?: VoiceCallClassification;
  callerName?: string | null;
  objectReference?: string | null;
  requestedDateTime?: string | null;
  createVorgang?: boolean;
};

export type VoiceSimulateRequest = {
  transcript: string;
  callerPhone?: string;
  callerName?: string;
  durationSeconds?: number;
};

export const VOICE_INTENT_LABELS: Record<VoiceIntent, string> = {
  besichtigung: "Besichtigungsanfrage",
  terminwunsch: "Terminwunsch",
  rueckruf: "Rückruf gewünscht",
  angebotsanfrage: "Angebotsanfrage",
  rechnung: "Rechnung / Zahlung",
  sonstiges: "Allgemeine Anfrage",
};

export const DEFAULT_VOICE_GREETING =
  "Guten Tag, Sie erreichen uns. Wie kann ich Ihnen helfen?";

export const DEFAULT_VOICE_DISCLOSURE =
  "Hinweis: Sie sprechen mit einem KI-gestützten Telefonassistenten. Ihre Angaben werden zur Bearbeitung Ihres Anliegens verarbeitet.";
