import { createTypedClient } from "@/lib/supabase/typed-client";
import type {
  CompletedVorgangInsert,
  CompletedVorgangRow,
  MailProvider,
} from "@/lib/database/types";
import type { CompletedVorgangRecord } from "@/features/workspace/services/vorgaenge/completed-vorgaenge-types";
import {
  fromDbStatus,
  toDbStatus,
} from "@/features/workspace/services/vorgaenge/completed-vorgaenge-types";

/** Einmalige Warnung — App fällt auf localStorage zurück, kein Crash. */
let tableMissingWarned = false;

function isTableMissingError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    (message.includes("completed_vorgaenge") &&
      (message.includes("schema cache") ||
        message.includes("does not exist") ||
        message.includes("could not find the table")))
  );
}

function warnTableMissing(
  context: string,
  error?: { message?: string } | null
): void {
  if (tableMissingWarned) return;
  tableMissingWarned = true;
  console.warn(
    `[HELPY] completed_vorgaenge fehlt in Supabase (${context}). Fallback: localStorage. Bitte Migration ausführen.`,
    error?.message ?? ""
  );
}

function mapRowToRecord(row: CompletedVorgangRow): CompletedVorgangRecord {
  const vorgangId = row.vorgang_id ?? row.case_id ?? row.provider_thread_id;
  return {
    id: row.id,
    companyId: row.company_id,
    workspaceId: vorgangId,
    provider: row.provider,
    providerThreadId: row.provider_thread_id,
    providerMessageId: row.provider_message_id,
    caseId: row.case_id ?? `${row.provider}:thread:${row.provider_thread_id}`,
    vorgangId,
    gmailThreadId: row.provider_thread_id,
    gmailMessageIds: row.provider_message_id ? [row.provider_message_id] : [],
    status: fromDbStatus(row.status),
    completedAt: row.completed_at,
    completedBy: row.completed_by,
    completedByUserId: row.completed_by,
    lastKnownIncomingMessageAt: row.last_known_incoming_message_at,
    lastKnownOutgoingMessageAt: row.last_known_outgoing_message_at,
    latestMessageAt:
      row.last_known_incoming_message_at ??
      row.last_known_outgoing_message_at ??
      row.completed_at,
    updatedAt: row.updated_at,
  };
}

function resolveProviderThreadIdForDb(
  record: CompletedVorgangRecord
): string {
  return (
    record.providerThreadId ??
    record.gmailThreadId ??
    record.caseId ??
    record.vorgangId ??
    record.workspaceId
  );
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCompletedVorgaengeCompanyId(value: string | null | undefined): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

export async function resolveAuthenticatedCompanyId(): Promise<string | null> {
  const supabase = createTypedClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.warn("[HELPY] profiles load failed for completed_vorgaenge:", error.message);
    return null;
  }

  const companyId = profile?.company_id ?? null;
  return isCompletedVorgaengeCompanyId(companyId) ? companyId : null;
}

function mapRecordToInsert(
  record: CompletedVorgangRecord,
  userId: string,
  companyId: string
): CompletedVorgangInsert | null {
  const providerThreadId = resolveProviderThreadIdForDb(record);
  if (!providerThreadId) {
    return null;
  }

  return {
    user_id: userId,
    company_id: companyId,
    provider: record.provider,
    provider_thread_id: providerThreadId,
    provider_message_id: record.providerMessageId,
    case_id: record.caseId,
    vorgang_id: record.vorgangId,
    status: toDbStatus(record.status),
    completed_at: record.completedAt,
    completed_by: record.completedBy ?? record.completedByUserId,
    last_known_incoming_message_at: record.lastKnownIncomingMessageAt,
    last_known_outgoing_message_at: record.lastKnownOutgoingMessageAt,
    updated_at: record.updatedAt,
  };
}

async function findExistingRow(params: {
  companyId: string;
  provider: MailProvider;
  providerThreadId: string | null;
  caseId: string;
}): Promise<CompletedVorgangRow | null> {
  const supabase = createTypedClient();
  if (!supabase) return null;

  if (params.providerThreadId) {
    const { data, error } = await supabase
      .from("completed_vorgaenge")
      .select("*")
      .eq("provider", params.provider)
      .eq("provider_thread_id", params.providerThreadId)
      .eq("company_id", params.companyId)
      .maybeSingle();

    if (isTableMissingError(error)) {
      warnTableMissing("find", error);
      return null;
    }
    if (data) return data;
  }

  const { data, error } = await supabase
    .from("completed_vorgaenge")
    .select("*")
    .eq("company_id", params.companyId)
    .eq("case_id", params.caseId)
    .maybeSingle();

  if (isTableMissingError(error)) {
    warnTableMissing("find", error);
    return null;
  }

  return data ?? null;
}

export type FetchCompletedVorgaengeResult = {
  ok: boolean;
  records: CompletedVorgangRecord[];
  /** true wenn Tabelle fehlt / Schema-Cache — localStorage bleibt Source of Truth */
  tableMissing?: boolean;
};

export async function fetchCompletedVorgaengeFromSupabase(
  companyId: string
): Promise<FetchCompletedVorgaengeResult> {
  const supabase = createTypedClient();
  if (!supabase || !isCompletedVorgaengeCompanyId(companyId)) {
    return { ok: true, records: [], tableMissing: false };
  }

  try {
    const { data, error } = await supabase
      .from("completed_vorgaenge")
      .select("*")
      .eq("company_id", companyId)
      .eq("status", "erledigt");

    if (error) {
      if (isTableMissingError(error)) {
        warnTableMissing("load", error);
        return { ok: true, records: [], tableMissing: true };
      }
      console.warn("[HELPY] completed_vorgaenge load failed:", error.message);
      return { ok: false, records: [] };
    }

    return { ok: true, records: (data ?? []).map(mapRowToRecord) };
  } catch (error) {
    console.warn("[HELPY] completed_vorgaenge load exception — localStorage Fallback", error);
    return { ok: true, records: [], tableMissing: true };
  }
}

export async function upsertCompletedVorgangToSupabase(
  record: CompletedVorgangRecord,
  userId: string,
  companyId?: string | null
): Promise<CompletedVorgangRecord | null> {
  const supabase = createTypedClient();
  if (!supabase) return null;

  const resolvedCompanyId =
    (isCompletedVorgaengeCompanyId(companyId) ? companyId : null) ??
    (isCompletedVorgaengeCompanyId(record.companyId) ? record.companyId : null);
  if (!resolvedCompanyId) return null;

  const payload = mapRecordToInsert(record, userId, resolvedCompanyId);
  if (!payload) return null;

  try {
    const existing = await findExistingRow({
      companyId: resolvedCompanyId,
      provider: record.provider,
      providerThreadId: payload.provider_thread_id,
      caseId: record.caseId,
    });

    if (existing) {
      const { data, error } = await supabase
        .from("completed_vorgaenge")
        .update({
          company_id: payload.company_id,
          provider: payload.provider,
          provider_thread_id: payload.provider_thread_id,
          provider_message_id: payload.provider_message_id,
          case_id: payload.case_id,
          vorgang_id: payload.vorgang_id,
          status: payload.status,
          completed_at: payload.completed_at,
          completed_by: payload.completed_by,
          last_known_incoming_message_at: payload.last_known_incoming_message_at,
          last_known_outgoing_message_at: payload.last_known_outgoing_message_at,
          updated_at: payload.updated_at,
        })
        .eq("id", existing.id)
        .select("*")
        .maybeSingle();

      if (error) {
        if (isTableMissingError(error)) {
          warnTableMissing("update", error);
          return null;
        }
        console.warn("[HELPY] completed_vorgaenge update failed:", error.message);
        return null;
      }

      return data ? mapRowToRecord(data) : null;
    }

    const { data, error } = await supabase
      .from("completed_vorgaenge")
      .insert(payload)
      .select("*")
      .maybeSingle();

    if (error) {
      if (isTableMissingError(error)) {
        warnTableMissing("insert", error);
        return null;
      }
      console.warn("[HELPY] completed_vorgaenge insert failed:", error.message);
      return null;
    }

    return data ? mapRowToRecord(data) : null;
  } catch (error) {
    console.warn("[HELPY] completed_vorgaenge upsert exception — localStorage Fallback", error);
    return null;
  }
}

export async function markCompletedVorgangReopenedInSupabase(params: {
  companyId: string;
  caseId: string;
  provider: MailProvider;
  providerThreadId: string | null;
  lastKnownIncomingMessageAt: string;
}): Promise<void> {
  const supabase = createTypedClient();
  if (!supabase || !isCompletedVorgaengeCompanyId(params.companyId)) return;

  try {
    const existing = await findExistingRow(params);
    if (!existing) return;

    const { error } = await supabase
      .from("completed_vorgaenge")
      .update({
        status: "neue_antwort_eingegangen",
        last_known_incoming_message_at: params.lastKnownIncomingMessageAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      if (isTableMissingError(error)) {
        warnTableMissing("reopen", error);
        return;
      }
      console.warn("[HELPY] completed_vorgaenge reopen failed:", error.message);
      await supabase.from("completed_vorgaenge").delete().eq("id", existing.id);
    }
  } catch (error) {
    console.warn("[HELPY] completed_vorgaenge reopen exception — localStorage Fallback", error);
  }
}

/** Nur für Tests. */
export function resetCompletedVorgaengeSupabaseWarningsForTests(): void {
  tableMissingWarned = false;
}
