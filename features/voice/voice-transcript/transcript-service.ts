import type { ConversationMessage } from "@/features/voice/voice-core/types";

export function createMessage(
  role: ConversationMessage["role"],
  text: string
): ConversationMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    createdAt: new Date().toISOString(),
  };
}

export function mergeTranscript(messages: ConversationMessage[]): string {
  return messages
    .filter((message) => message.role === "caller" || message.role === "helpy")
    .map((message) => `${message.role === "caller" ? "Anrufer" : "HELPY"}: ${message.text}`)
    .join("\n");
}

export function speechToText(input: { audio?: unknown; text?: string }): string {
  if (typeof input.text === "string" && input.text.trim()) {
    return input.text.trim();
  }
  return "";
}

export function textToSpeech(input: { text: string }): { text: string; audioUrl: null } {
  return { text: input.text, audioUrl: null };
}
