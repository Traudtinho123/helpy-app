import type { SupabaseClient } from "@supabase/supabase-js";
import type { VorgangEventInsert } from "@/lib/database/types";

export async function insertVorgangEvents(
  supabase: SupabaseClient,
  rows: VorgangEventInsert[]
): Promise<{ inserted: number; skipped: number }> {
  if (rows.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  const { data, error } = await supabase
    .from("vorgang_events")
    .upsert(rows, {
      onConflict: "company_id,provider,provider_thread_id,received_at",
      ignoreDuplicates: true,
    })
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  const inserted = data?.length ?? 0;
  return { inserted, skipped: rows.length - inserted };
}

export type VorgangEventRow = {
  received_at: string;
  is_appointment_request: boolean;
  is_new_inquiry: boolean;
};

export type VorgangEventDetailRow = {
  vorgang_id: string;
  provider_thread_id: string;
  kunde_name: string | null;
  received_at: string;
  prioritaet: string | null;
  typ: string;
};

export async function fetchVorgangEventsInRange(
  supabase: SupabaseClient,
  companyId: string,
  fromIso: string,
  toIso: string
): Promise<VorgangEventRow[]> {
  const { data, error } = await supabase
    .from("vorgang_events")
    .select("received_at, is_appointment_request, is_new_inquiry")
    .eq("company_id", companyId)
    .gte("received_at", fromIso)
    .lte("received_at", toIso);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as VorgangEventRow[];
}

export async function fetchVorgangEventDetailsSince(
  supabase: SupabaseClient,
  companyId: string,
  fromIso: string
): Promise<VorgangEventDetailRow[]> {
  const { data, error } = await supabase
    .from("vorgang_events")
    .select(
      "vorgang_id, provider_thread_id, kunde_name, received_at, prioritaet, typ"
    )
    .eq("company_id", companyId)
    .gte("received_at", fromIso)
    .order("received_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as VorgangEventDetailRow[];
}

export async function fetchCompletedVorgangKeys(
  supabase: SupabaseClient,
  companyId: string
): Promise<{ vorgangIds: Set<string>; threadIds: Set<string> }> {
  const { data, error } = await supabase
    .from("completed_vorgaenge")
    .select("vorgang_id, provider_thread_id, status")
    .eq("company_id", companyId)
    .eq("status", "erledigt");

  if (error) {
    throw new Error(error.message);
  }

  const vorgangIds = new Set<string>();
  const threadIds = new Set<string>();

  for (const row of data ?? []) {
    if (row.vorgang_id) vorgangIds.add(row.vorgang_id);
    if (row.provider_thread_id) threadIds.add(row.provider_thread_id);
  }

  return { vorgangIds, threadIds };
}

export async function fetchCompletedAtInRange(
  supabase: SupabaseClient,
  companyId: string,
  fromIso: string,
  toIso: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("completed_vorgaenge")
    .select("completed_at")
    .eq("company_id", companyId)
    .eq("status", "erledigt")
    .gte("completed_at", fromIso)
    .lte("completed_at", toIso);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => row.completed_at)
    .filter((value): value is string => Boolean(value));
}

export async function fetchNewCustomersInRange(
  supabase: SupabaseClient,
  companyId: string,
  fromIso: string,
  toIso: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("kunden")
    .select("erstellt_am")
    .eq("company_id", companyId)
    .gte("erstellt_am", fromIso)
    .lte("erstellt_am", toIso);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => row.erstellt_am)
    .filter((value): value is string => Boolean(value));
}

export async function fetchTermineStartsInRange(
  supabase: SupabaseClient,
  companyId: string,
  fromIso: string,
  toIso: string,
  options?: { upcomingOnly?: boolean; nowIso?: string }
): Promise<string[]> {
  let query = supabase
    .from("termine")
    .select("start")
    .eq("company_id", companyId)
    .gte("start", options?.upcomingOnly ? (options.nowIso ?? fromIso) : fromIso)
    .lte("start", toIso)
    .in("status", ["geplant", "bestaetigt"]);

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => row.start)
    .filter((value): value is string => Boolean(value));
}

export async function fetchVoiceCallStartedAtInRange(
  companyId: string,
  fromIso: string,
  toIso: string
): Promise<string[]> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("voice_calls")
    .select("started_at")
    .eq("company_id", companyId)
    .gte("started_at", fromIso)
    .lte("started_at", toIso);

  if (error) {
    const message = error.message ?? "";
    if (
      message.includes("Could not find the table") ||
      message.includes("schema cache") ||
      error.code === "PGRST205"
    ) {
      console.warn(
        "[analytics] voice_calls nicht verfügbar — KPI wird übersprungen:",
        message
      );
      return [];
    }
    throw new Error(message);
  }

  return (data ?? [])
    .map((row) => row.started_at)
    .filter((value): value is string => Boolean(value));
}
