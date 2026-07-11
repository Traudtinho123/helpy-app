export type VoiceTranscriptTurn = {
  role: "caller" | "helpy";
  text: string;
  at: string;
};

export type VoiceCallSession = {
  callSid: string;
  companyId: string;
  callerPhone: string | null;
  dbCallId: string | null;
  turns: VoiceTranscriptTurn[];
  turnCount: number;
  emptyResultCount: number;
  createdAt: number;
  updatedAt: number;
};

const SESSION_TTL_MS = 1000 * 60 * 60;
const MAX_TURNS_BEFORE_GOODBYE = 8;

const sessions = new Map<string, VoiceCallSession>();

function pruneExpiredSessions(): void {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [key, session] of sessions.entries()) {
    if (session.updatedAt < cutoff) {
      sessions.delete(key);
    }
  }
}

export function getVoiceCallSession(callSid: string): VoiceCallSession | null {
  pruneExpiredSessions();
  return sessions.get(callSid) ?? null;
}

export function createVoiceCallSession(input: {
  callSid: string;
  companyId: string;
  callerPhone?: string | null;
  dbCallId?: string | null;
  emptyResultCount?: number;
  /** Bestehende Turns beim Wiederherstellen (z. B. aus DB). */
  turns?: VoiceTranscriptTurn[];
}): VoiceCallSession {
  pruneExpiredSessions();
  const existing = sessions.get(input.callSid);
  if (existing) {
    if (input.dbCallId !== undefined) existing.dbCallId = input.dbCallId;
    if (input.callerPhone !== undefined) {
      existing.callerPhone = input.callerPhone ?? existing.callerPhone;
    }
    if (input.emptyResultCount !== undefined) {
      existing.emptyResultCount = input.emptyResultCount;
    }
    if (input.turns && input.turns.length > existing.turns.length) {
      existing.turns = [...input.turns];
      existing.turnCount = existing.turns.filter((turn) => turn.role === "caller").length;
    }
    existing.updatedAt = Date.now();
    sessions.set(input.callSid, existing);
    return existing;
  }

  const now = Date.now();
  const turns = input.turns ?? [];
  const session: VoiceCallSession = {
    callSid: input.callSid,
    companyId: input.companyId,
    callerPhone: input.callerPhone ?? null,
    dbCallId: input.dbCallId ?? null,
    turns: [...turns],
    turnCount: turns.filter((turn) => turn.role === "caller").length,
    emptyResultCount: input.emptyResultCount ?? 0,
    createdAt: now,
    updatedAt: now,
  };
  sessions.set(input.callSid, session);
  return session;
}

export function upsertVoiceCallSession(
  callSid: string,
  patch: Partial<Pick<VoiceCallSession, "dbCallId" | "callerPhone" | "emptyResultCount">>
): VoiceCallSession | null {
  const session = getVoiceCallSession(callSid);
  if (!session) return null;

  if (patch.dbCallId !== undefined) session.dbCallId = patch.dbCallId;
  if (patch.callerPhone !== undefined) session.callerPhone = patch.callerPhone;
  if (patch.emptyResultCount !== undefined) {
    session.emptyResultCount = patch.emptyResultCount;
  }
  session.updatedAt = Date.now();
  sessions.set(callSid, session);
  return session;
}

export function incrementEmptyResultCount(callSid: string): number {
  const session = getVoiceCallSession(callSid);
  if (!session) return 1;
  session.emptyResultCount += 1;
  session.updatedAt = Date.now();
  sessions.set(callSid, session);
  return session.emptyResultCount;
}

export function resetEmptyResultCount(callSid: string): void {
  const session = getVoiceCallSession(callSid);
  if (!session) return;
  session.emptyResultCount = 0;
  session.updatedAt = Date.now();
  sessions.set(callSid, session);
}

export function appendVoiceCallTurn(
  callSid: string,
  turn: VoiceTranscriptTurn
): VoiceCallSession | null {
  const session = getVoiceCallSession(callSid);
  if (!session) return null;

  session.turns.push(turn);
  if (turn.role === "caller") {
    session.turnCount += 1;
  }
  session.updatedAt = Date.now();
  sessions.set(callSid, session);
  console.log("[voice] SESSION TURNS:", JSON.stringify(session.turns));
  return session;
}

export function deleteVoiceCallSession(callSid: string): VoiceCallSession | null {
  const session = sessions.get(callSid) ?? null;
  sessions.delete(callSid);
  return session;
}

export function countInMemoryVoiceSessionsForCompany(companyId: string): number {
  pruneExpiredSessions();
  let count = 0;
  for (const session of sessions.values()) {
    if (session.companyId === companyId) count += 1;
  }
  return count;
}

export function shouldEndVoiceCall(session: VoiceCallSession): boolean {
  return session.turnCount >= MAX_TURNS_BEFORE_GOODBYE;
}

export function flattenVoiceTranscript(turns: VoiceTranscriptTurn[]): string {
  return turns
    .map((turn) => {
      const label = turn.role === "caller" ? "Anrufer" : "HELPY";
      return `${label}: ${turn.text}`;
    })
    .join("\n");
}
