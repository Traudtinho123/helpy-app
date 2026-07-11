import type { VoiceIntent } from "@/features/voice/types/voice-types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export type VoiceMemoryRecord = {
  memoryId: string;
  conversationId: string;
  callId: string;
  vorgangId: string | null;
  skill: HelpySkill;
  createdAt: string;
  transcript: string;
  summary: string;
  sentiment: "positiv" | "neutral" | "negativ";
  intent: VoiceIntent;
  intentLabel: string;
  openTasks: string[];
  discussedObjects: string[];
  appointments: string[];
  questions: string[];
  nextStep: string;
  callerName: string | null;
  callerPhone: string | null;
};

export type VoiceMemoryInput = {
  conversationId: string;
  callId: string;
  vorgangId: string | null;
  skill: HelpySkill;
  transcript: string;
  summary: string;
  intent: VoiceIntent;
  intentLabel: string;
  callerName?: string | null;
  callerPhone?: string | null;
  nextAction?: string | null;
};

const STORAGE_KEY = "helpy-voice-memory-v1";

function readStore(): VoiceMemoryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VoiceMemoryRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(records: VoiceMemoryRecord[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function extractQuestions(transcript: string): string[] {
  return transcript
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter((part) => part.includes("?") || part.toLowerCase().startsWith("kann "))
    .slice(0, 5);
}

function inferSentiment(transcript: string): VoiceMemoryRecord["sentiment"] {
  const lower = transcript.toLowerCase();
  if (/dringend|unzufrieden|problem|beschwerde/.test(lower)) return "negativ";
  if (/danke|super|gerne|freue/.test(lower)) return "positiv";
  return "neutral";
}

function inferObjects(transcript: string): string[] {
  const matches = transcript.match(/\d+(\.5)?-?zimmer|wohnung|haus|objekt|immobilie/gi);
  return matches ? [...new Set(matches.map((m) => m.trim()))] : [];
}

function inferAppointments(transcript: string): string[] {
  const matches = transcript.match(
    /(besichtigung|termin|morgen|übermorgen|montag|dienstag|mittwoch|donnerstag|freitag|\d{1,2}:\d{2}|\d{1,2}\s*uhr)/gi
  );
  return matches ? [...new Set(matches.map((m) => m.trim()))] : [];
}

export function saveVoiceMemory(input: VoiceMemoryInput): VoiceMemoryRecord {
  const memoryId = `vm-${input.conversationId}`;
  const record: VoiceMemoryRecord = {
    memoryId,
    conversationId: input.conversationId,
    callId: input.callId,
    vorgangId: input.vorgangId,
    skill: input.skill,
    createdAt: new Date().toISOString(),
    transcript: input.transcript,
    summary: input.summary,
    sentiment: inferSentiment(input.transcript),
    intent: input.intent,
    intentLabel: input.intentLabel,
    openTasks: input.nextAction ? [input.nextAction] : ["Anliegen prüfen"],
    discussedObjects: inferObjects(input.transcript),
    appointments: inferAppointments(input.transcript),
    questions: extractQuestions(input.transcript),
    nextStep: input.nextAction ?? "Rückruf oder Follow-up vorbereiten",
    callerName: input.callerName ?? null,
    callerPhone: input.callerPhone ?? null,
  };

  const store = readStore().filter((item) => item.memoryId !== memoryId);
  writeStore([record, ...store]);
  return record;
}

export function getVoiceMemoryRecords(): VoiceMemoryRecord[] {
  return readStore();
}

export function getVoiceMemoryByConversation(
  conversationId: string
): VoiceMemoryRecord | null {
  return readStore().find((item) => item.conversationId === conversationId) ?? null;
}

export function searchVoiceMemory(query: string): VoiceMemoryRecord[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return getVoiceMemoryRecords();
  return getVoiceMemoryRecords().filter(
    (item) =>
      item.transcript.toLowerCase().includes(normalized) ||
      item.summary.toLowerCase().includes(normalized) ||
      item.intentLabel.toLowerCase().includes(normalized)
  );
}
