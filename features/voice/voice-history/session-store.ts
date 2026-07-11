import type { ConversationSession } from "@/features/voice/voice-core/types";

const STORAGE_KEY = "helpy-voice-history-v1";

function readStore(): ConversationSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ConversationSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(sessions: ConversationSession[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function saveConversationSession(session: ConversationSession): void {
  const store = readStore().filter(
    (item) => item.conversationId !== session.conversationId
  );
  writeStore([session, ...store]);
}

export function upsertConversationSession(session: ConversationSession): void {
  saveConversationSession(session);
}

export function getConversationSession(
  conversationId: string
): ConversationSession | null {
  return readStore().find((item) => item.conversationId === conversationId) ?? null;
}

export function getActiveConversations(): ConversationSession[] {
  return readStore().filter((item) => item.status === "active");
}

export function getPastConversations(): ConversationSession[] {
  return readStore().filter((item) => item.status === "completed");
}

export function getAllConversationSessions(): ConversationSession[] {
  return readStore();
}
