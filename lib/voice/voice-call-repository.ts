import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { Json } from "@/lib/database/types";
import type {
  VoiceCallRecord,
  VoiceCallStatus,
  VoiceIntent,
} from "@/features/voice/types/voice-types";
import { VOICE_INTENT_LABELS } from "@/features/voice/types/voice-types";

type VoiceCallRow = {
  id: string;
  company_id: string;
  external_call_id: string | null;
  caller_phone: string | null;
  caller_name: string | null;
  status: VoiceCallStatus;
  duration_seconds: number | null;
  transcript: string | null;
  transcript_turns?: Json | null;
  summary: string | null;
  intent: string | null;
  vorgang_id: string | null;
  assistant_reply: string | null;
  processed_payload: Json | null;
  client_ack_at: string | null;
  started_at: string;
  ended_at: string | null;
};

const devCalls = new Map<string, VoiceCallRow>();

function generateDevId(): string {
  return `dev-voice-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function rowToRecord(row: VoiceCallRow): VoiceCallRecord {
  const turns = Array.isArray(row.transcript_turns)
    ? (row.transcript_turns as VoiceCallRecord["transcriptTurns"])
    : undefined;

  return {
    id: row.id,
    companyId: row.company_id,
    externalCallId: row.external_call_id,
    callerPhone: row.caller_phone,
    callerName: row.caller_name,
    status: row.status,
    durationSeconds: row.duration_seconds,
    transcript: row.transcript,
    summary: row.summary,
    intent: (row.intent as VoiceIntent | null) ?? null,
    vorgangId: row.vorgang_id,
    transcriptTurns: turns,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    clientAckAt: row.client_ack_at,
    hasPreparedVorgang: Boolean(row.processed_payload && row.vorgang_id),
  };
}

export async function createVoiceCall(
  companyId: string,
  input: {
    externalCallId?: string | null;
    callerPhone?: string | null;
    callerName?: string | null;
    status?: VoiceCallStatus;
    durationSeconds?: number | null;
    transcript?: string | null;
    summary?: string | null;
    intent?: VoiceIntent | null;
    vorgangId?: string | null;
    startedAt?: string;
    endedAt?: string | null;
  }
): Promise<VoiceCallRecord> {
  const id = generateDevId();
  const row: VoiceCallRow = {
    id,
    company_id: companyId,
    external_call_id: input.externalCallId ?? null,
    caller_phone: input.callerPhone ?? null,
    caller_name: input.callerName ?? null,
    status: input.status ?? "completed",
    duration_seconds: input.durationSeconds ?? null,
    transcript: input.transcript ?? null,
    summary: input.summary ?? null,
    intent: input.intent ?? null,
    vorgang_id: input.vorgangId ?? null,
    assistant_reply: null,
    processed_payload: null,
    client_ack_at: null,
    started_at: input.startedAt ?? new Date().toISOString(),
    ended_at: input.endedAt ?? null,
  };

  if (!isSupabaseAdminConfigured()) {
    devCalls.set(id, row);
    return rowToRecord(row);
  }

  const admin = createAdminClient();
  if (!admin) {
    devCalls.set(id, row);
    return rowToRecord(row);
  }

  const { data, error } = await admin
    .from("voice_calls")
    .insert({
      company_id: row.company_id,
      external_call_id: row.external_call_id,
      caller_phone: row.caller_phone,
      caller_name: row.caller_name,
      status: row.status,
      duration_seconds: row.duration_seconds,
      transcript: row.transcript,
      summary: row.summary,
      intent: row.intent,
      vorgang_id: row.vorgang_id,
      started_at: row.started_at,
      ended_at: row.ended_at,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[voice] create call failed:", error?.message);
    devCalls.set(id, row);
    return rowToRecord(row);
  }

  return rowToRecord(data as VoiceCallRow);
}

export async function findVoiceCallByExternalId(
  externalCallId: string
): Promise<VoiceCallRecord | null> {
  if (!isSupabaseAdminConfigured()) {
    const row = [...devCalls.values()].find(
      (item) => item.external_call_id === externalCallId
    );
    return row ? rowToRecord(row) : null;
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("voice_calls")
    .select("*")
    .eq("external_call_id", externalCallId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToRecord(data as VoiceCallRow);
}

export async function updateVoiceCall(
  callId: string,
  patch: Partial<VoiceCallRow>
): Promise<VoiceCallRecord | null> {
  if (!isSupabaseAdminConfigured()) {
    const existing = devCalls.get(callId);
    if (!existing) return null;
    const next = { ...existing, ...patch };
    devCalls.set(callId, next);
    return rowToRecord(next);
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("voice_calls")
    .update(patch)
    .eq("id", callId)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[voice] update call failed:", error.message);
    return null;
  }

  return data ? rowToRecord(data as VoiceCallRow) : null;
}

export async function listVoiceCallsForCompany(
  companyId: string,
  limit = 20
): Promise<VoiceCallRecord[]> {
  if (!isSupabaseAdminConfigured()) {
    return [...devCalls.values()]
      .filter((row) => row.company_id === companyId)
      .sort((a, b) => b.started_at.localeCompare(a.started_at))
      .slice(0, limit)
      .map(rowToRecord);
  }

  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("voice_calls")
    .select("*")
    .eq("company_id", companyId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[voice] list calls failed:", error.message);
    return [];
  }

  return (data as VoiceCallRow[]).map(rowToRecord);
}

export type VoicePendingIntake = {
  callId: string;
  processed: import("@/features/voice/types/voice-types").VoiceProcessedCall;
};

export async function listPendingVoiceIntakes(
  companyId: string,
  limit = 10
): Promise<VoicePendingIntake[]> {
  const filterRows = (rows: VoiceCallRow[]) =>
    rows
      .filter(
        (row) =>
          row.company_id === companyId &&
          row.status === "completed" &&
          !row.client_ack_at &&
          row.processed_payload
      )
      .sort((a, b) => b.started_at.localeCompare(a.started_at))
      .slice(0, limit);

  let rows: VoiceCallRow[] = [];

  if (!isSupabaseAdminConfigured()) {
    rows = filterRows([...devCalls.values()]);
  } else {
    const admin = createAdminClient();
    if (admin) {
      const { data, error } = await admin
        .from("voice_calls")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "completed")
        .is("client_ack_at", null)
        .not("processed_payload", "is", null)
        .order("started_at", { ascending: false })
        .limit(limit);

      if (!error && data) {
        rows = data as VoiceCallRow[];
      }
    }
  }

  return rows
    .map((row) => {
      try {
        const processed = row.processed_payload as VoicePendingIntake["processed"];
        if (!processed?.vorgangId) return null;
        return { callId: row.id, processed };
      } catch {
        return null;
      }
    })
    .filter((item): item is VoicePendingIntake => item !== null);
}

export async function ackVoiceIntakes(
  companyId: string,
  callIds: string[]
): Promise<number> {
  const ackAt = new Date().toISOString();
  let count = 0;

  for (const callId of callIds) {
    if (!isSupabaseAdminConfigured()) {
      const row = devCalls.get(callId);
      if (row && row.company_id === companyId) {
        devCalls.set(callId, { ...row, client_ack_at: ackAt });
        count += 1;
      }
      continue;
    }

    const admin = createAdminClient();
    if (!admin) continue;

    const { error } = await admin
      .from("voice_calls")
      .update({ client_ack_at: ackAt })
      .eq("id", callId)
      .eq("company_id", companyId);

    if (!error) count += 1;
  }

  return count;
}

export async function countActiveVoiceCallsForCompany(companyId: string): Promise<number> {
  if (!isSupabaseAdminConfigured()) {
    return [...devCalls.values()].filter(
      (row) =>
        row.company_id === companyId &&
        (row.status === "ringing" || row.status === "in_progress")
    ).length;
  }

  const admin = createAdminClient();
  if (!admin) return 0;

  const { count, error } = await admin
    .from("voice_calls")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .in("status", ["ringing", "in_progress"]);

  if (error) {
    console.error("[voice] count active calls failed:", error.message);
    return 0;
  }

  return count ?? 0;
}

export type VoiceCallStats = {
  today: number;
  thisWeek: number;
  total: number;
  avgDurationSeconds: number;
};

export type VoiceIntentStat = {
  intent: VoiceIntent | "unbekannt";
  label: string;
  count: number;
};

function startOfLocalDay(date: Date): number {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

function startOfLocalWeek(date: Date): number {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

export async function getVoiceCallStatsForCompany(
  companyId: string
): Promise<VoiceCallStats> {
  const calls = await listVoiceCallsForCompany(companyId, 200);
  const now = Date.now();
  const dayStart = startOfLocalDay(new Date(now));
  const weekStart = startOfLocalWeek(new Date(now));

  const completedWithDuration = calls.filter(
    (call) => call.durationSeconds != null && call.durationSeconds > 0
  );
  const avgDurationSeconds =
    completedWithDuration.length > 0
      ? Math.round(
          completedWithDuration.reduce(
            (sum, call) => sum + (call.durationSeconds ?? 0),
            0
          ) / completedWithDuration.length
        )
      : 0;

  return {
    today: calls.filter((call) => Date.parse(call.startedAt) >= dayStart).length,
    thisWeek: calls.filter((call) => Date.parse(call.startedAt) >= weekStart).length,
    total: calls.length,
    avgDurationSeconds,
  };
}

export async function getVoiceIntentStatsForCompany(
  companyId: string
): Promise<VoiceIntentStat[]> {
  const calls = await listVoiceCallsForCompany(companyId, 200);
  const counts = new Map<string, number>();

  for (const call of calls) {
    const key = call.intent ?? "unbekannt";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([intent, count]) => ({
      intent: intent as VoiceIntent | "unbekannt",
      label:
        intent === "unbekannt"
          ? "Unbekannt"
          : VOICE_INTENT_LABELS[intent as VoiceIntent] ?? intent,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}
