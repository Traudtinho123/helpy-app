import type { VoiceTranscriptTurn } from "@/lib/voice/voice-call-session-store";
import {
  flattenVoiceTranscript,
  getVoiceCallSession,
  createVoiceCallSession,
  type VoiceCallSession,
} from "@/lib/voice/voice-call-session-store";
import {
  findVoiceCallByExternalId,
  updateVoiceCall,
} from "@/lib/voice/voice-call-repository";
import type { Json } from "@/lib/database/types";

export function normalizeTranscriptTurns(
  turns: unknown
): VoiceTranscriptTurn[] {
  if (!Array.isArray(turns)) return [];

  return turns
    .map((turn) => {
      if (!turn || typeof turn !== "object") return null;
      const item = turn as Partial<VoiceTranscriptTurn>;
      if (
        (item.role !== "caller" && item.role !== "helpy") ||
        typeof item.text !== "string" ||
        typeof item.at !== "string"
      ) {
        return null;
      }
      return {
        role: item.role,
        text: item.text.trim(),
        at: item.at,
      };
    })
    .filter((turn): turn is VoiceTranscriptTurn => Boolean(turn?.text));
}

export function pickLatestTranscriptTurns(
  ...sources: Array<VoiceTranscriptTurn[] | undefined | null>
): VoiceTranscriptTurn[] {
  let best: VoiceTranscriptTurn[] = [];

  for (const source of sources) {
    const normalized = normalizeTranscriptTurns(source);
    if (normalized.length > best.length) {
      best = normalized;
    }
  }

  return best;
}

export function countCallerTurns(turns: VoiceTranscriptTurn[]): number {
  return turns.filter((turn) => turn.role === "caller").length;
}

export function applyTurnsToSession(
  session: VoiceCallSession,
  turns: VoiceTranscriptTurn[]
): VoiceCallSession {
  session.turns = [...turns];
  session.turnCount = countCallerTurns(turns);
  session.updatedAt = Date.now();
  return session;
}

/** Lädt Turns aus DB und synchronisiert die In-Memory-Session (serverless-sicher). */
export async function ensureVoiceCallSessionWithDbTurns(input: {
  callSid: string;
  companyId: string;
  callerPhone?: string | null;
}): Promise<{ session: VoiceCallSession; callId: string | null; turns: VoiceTranscriptTurn[] }> {
  const dbCall = await findVoiceCallByExternalId(input.callSid);
  const dbTurns = normalizeTranscriptTurns(dbCall?.transcriptTurns);

  let session = getVoiceCallSession(input.callSid);

  if (!session) {
    session = createVoiceCallSession({
      callSid: input.callSid,
      companyId: input.companyId,
      callerPhone: input.callerPhone ?? dbCall?.callerPhone ?? null,
      dbCallId: dbCall?.id ?? null,
      emptyResultCount: dbCall?.emptyResultCount ?? 0,
    });
  }

  const mergedTurns = pickLatestTranscriptTurns(session.turns, dbTurns);
  applyTurnsToSession(session, mergedTurns);

  if (dbCall?.id && !session.dbCallId) {
    session.dbCallId = dbCall.id;
  }

  if ((dbCall?.emptyResultCount ?? 0) > session.emptyResultCount) {
    session.emptyResultCount = dbCall?.emptyResultCount ?? 0;
  }

  return {
    session,
    callId: session.dbCallId ?? dbCall?.id ?? null,
    turns: mergedTurns,
  };
}

export async function persistVoiceCallSessionState(
  callId: string,
  session: VoiceCallSession,
  patch?: {
    status?: "ringing" | "in_progress" | "completed" | "failed" | "missed";
    callerPhone?: string | null;
    assistantReply?: string | null;
  }
): Promise<void> {
  await persistVoiceCallTranscript(callId, session.turns, patch);
  await updateVoiceCall(callId, {
    empty_result_count: session.emptyResultCount,
  });
}

/** Schreibt transcript + transcript_turns sofort in die DB. */
export async function persistVoiceCallTranscript(
  callId: string,
  turns: VoiceTranscriptTurn[],
  patch?: {
    status?: "ringing" | "in_progress" | "completed" | "failed" | "missed";
    callerPhone?: string | null;
    assistantReply?: string | null;
  }
): Promise<void> {
  const normalized = normalizeTranscriptTurns(turns);

  await updateVoiceCall(callId, {
    transcript: flattenVoiceTranscript(normalized),
    transcript_turns: normalized as unknown as Json,
    ...(patch?.status ? { status: patch.status } : {}),
    ...(patch?.callerPhone !== undefined
      ? { caller_phone: patch.callerPhone }
      : {}),
    ...(patch?.assistantReply !== undefined
      ? { assistant_reply: patch.assistantReply }
      : {}),
  });
}
