import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { VoiceIntent } from "@/features/voice/types/voice-types";

/** Provider-agnostischer Anruf — der Core kennt kein Twilio. */
export type VoiceCall = {
  callId: string;
  conversationId: string;
  callerPhone: string | null;
  callerName: string | null;
  status: "ringing" | "active" | "completed" | "failed" | "missed";
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
};

export type ConversationMessage = {
  id: string;
  role: "caller" | "helpy" | "system";
  text: string;
  createdAt: string;
};

export type ConversationSession = {
  conversationId: string;
  callId: string;
  customerId: string | null;
  skill: HelpySkill;
  language: string;
  /** Provider-ID (mock, twilio, …) — nur Metadaten, keine Provider-Logik im Core */
  providerId: string;
  startedAt: string;
  endedAt: string | null;
  status: "active" | "completed" | "failed";
  messages: ConversationMessage[];
  summary: string | null;
  sentiment: "positiv" | "neutral" | "negativ" | null;
  nextAction: string | null;
  intent: VoiceIntent | null;
  transcript: string | null;
  vorgangId: string | null;
};

export type VoiceBrainContext = {
  skill: HelpySkill;
  customerName: string | null;
  customerPhone: string | null;
  openVorgaenge: string[];
  recentCalls: string[];
  calendarHint: string | null;
  companyKnowledge: string | null;
};

export type VoiceTurnInput = {
  conversationId: string;
  callerText: string;
  skill?: HelpySkill;
  callerName?: string | null;
  callerPhone?: string | null;
};

export type VoiceTurnResult = {
  conversation: ConversationSession;
  assistantReply: string;
  intent: VoiceIntent;
  intentLabel: string;
};

export type VoiceConversationEndResult = {
  conversation: ConversationSession;
  assistantReply: string;
  vorgangId: string;
  memoryId: string;
};
