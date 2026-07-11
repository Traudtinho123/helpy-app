import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type {
  CreateVorgangInput,
  VorgangDbRecord,
  VorgangSource,
} from "@/features/vorgaenge/types/create-vorgang-types";

const devVorgaenge = new Map<string, VorgangDbRecord>();

function generateDevId(): string {
  return `dev-vorgang-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function rowToRecord(row: Record<string, unknown>): VorgangDbRecord {
  return {
    id: String(row.id),
    company_id: String(row.company_id),
    source: row.source as VorgangSource,
    titel: String(row.titel),
    inhalt: String(row.inhalt),
    prioritaet: String(row.prioritaet),
    status: String(row.status),
    kunden_id: (row.kunden_id as string | null) ?? null,
    objekt_id: (row.objekt_id as string | null) ?? null,
    gmail_message_id: (row.gmail_message_id as string | null) ?? null,
    gmail_thread_id: (row.gmail_thread_id as string | null) ?? null,
    voice_call_id: (row.voice_call_id as string | null) ?? null,
    anrufer_nummer: (row.anrufer_nummer as string | null) ?? null,
    termin_datum: (row.termin_datum as string | null) ?? null,
    termin_uhrzeit: (row.termin_uhrzeit as string | null) ?? null,
    whatsapp_message_id: (row.whatsapp_message_id as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function findVorgangByGmailMessageId(
  companyId: string,
  gmailMessageId: string
): Promise<VorgangDbRecord | null> {
  if (!gmailMessageId.trim()) return null;

  if (!isSupabaseAdminConfigured()) {
    const match = [...devVorgaenge.values()].find(
      (item) =>
        item.company_id === companyId &&
        item.gmail_message_id === gmailMessageId
    );
    return match ?? null;
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("vorgaenge")
    .select("*")
    .eq("company_id", companyId)
    .eq("gmail_message_id", gmailMessageId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToRecord(data as Record<string, unknown>);
}

export async function findVorgangByVoiceCallId(
  voiceCallId: string
): Promise<VorgangDbRecord | null> {
  if (!voiceCallId.trim()) return null;

  if (!isSupabaseAdminConfigured()) {
    const match = [...devVorgaenge.values()].find(
      (item) => item.voice_call_id === voiceCallId
    );
    return match ?? null;
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("vorgaenge")
    .select("*")
    .eq("voice_call_id", voiceCallId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToRecord(data as Record<string, unknown>);
}

export async function insertVorgangRecord(
  input: CreateVorgangInput
): Promise<VorgangDbRecord> {
  const now = new Date().toISOString();
  const row: VorgangDbRecord = {
    id: generateDevId(),
    company_id: input.company_id,
    source: input.source,
    titel: input.titel.trim(),
    inhalt: input.inhalt.trim(),
    prioritaet: input.prioritaet,
    status: input.status,
    kunden_id: input.kunden_id ?? null,
    objekt_id: input.objekt_id ?? null,
    gmail_message_id: input.gmail_message_id ?? null,
    gmail_thread_id: input.gmail_thread_id ?? null,
    voice_call_id: input.voice_call_id ?? null,
    anrufer_nummer: input.anrufer_nummer ?? null,
    termin_datum: input.termin_datum ?? null,
    termin_uhrzeit: input.termin_uhrzeit ?? null,
    whatsapp_message_id: input.whatsapp_message_id ?? null,
    created_at: now,
    updated_at: now,
  };

  if (!isSupabaseAdminConfigured()) {
    devVorgaenge.set(row.id, row);
    return row;
  }

  const admin = createAdminClient();
  if (!admin) {
    devVorgaenge.set(row.id, row);
    return row;
  }

  const { data, error } = await admin
    .from("vorgaenge")
    .insert({
      company_id: row.company_id,
      source: row.source,
      titel: row.titel,
      inhalt: row.inhalt,
      prioritaet: row.prioritaet,
      status: row.status,
      kunden_id: row.kunden_id,
      objekt_id: row.objekt_id,
      gmail_message_id: row.gmail_message_id,
      gmail_thread_id: row.gmail_thread_id,
      voice_call_id: row.voice_call_id,
      anrufer_nummer: row.anrufer_nummer,
      termin_datum: row.termin_datum,
      termin_uhrzeit: row.termin_uhrzeit,
      whatsapp_message_id: row.whatsapp_message_id,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[vorgaenge] insert failed:", error?.message);
    devVorgaenge.set(row.id, row);
    return row;
  }

  return rowToRecord(data as Record<string, unknown>);
}

export async function listVorgaengeForCompany(
  companyId: string,
  limit = 100
): Promise<VorgangDbRecord[]> {
  if (!isSupabaseAdminConfigured()) {
    return [...devVorgaenge.values()]
      .filter((item) => item.company_id === companyId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }

  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("vorgaenge")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[vorgaenge] list failed:", error.message);
    return [];
  }

  return (data as Record<string, unknown>[]).map(rowToRecord);
}

export async function getVorgangRecordById(
  vorgangId: string,
  companyId: string
): Promise<VorgangDbRecord | null> {
  if (!isSupabaseAdminConfigured()) {
    const row = devVorgaenge.get(vorgangId);
    return row && row.company_id === companyId ? row : null;
  }

  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("vorgaenge")
    .select("*")
    .eq("id", vorgangId)
    .eq("company_id", companyId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToRecord(data as Record<string, unknown>);
}
