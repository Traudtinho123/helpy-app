import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { VoiceStandardResponseRow } from "@/lib/database/types";
import {
  DEFAULT_VOICE_STANDARD_RESPONSES,
  type VoiceStandardResponse,
  type VoiceStandardResponseCategory,
} from "@/features/voice/types/voice-standard-response-types";

const devResponses = new Map<string, VoiceStandardResponseRow[]>();

export class VoiceStandardResponsesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VoiceStandardResponsesError";
  }
}

function isDraftOrDevId(id: string | undefined): boolean {
  return !id || id.startsWith("draft-") || id.startsWith("dev-");
}

function rowToResponse(row: VoiceStandardResponseRow): VoiceStandardResponse {
  return {
    id: row.id,
    companyId: row.company_id,
    triggerText: row.trigger_text,
    responseText: row.response_text,
    category: row.category as VoiceStandardResponseCategory,
    enabled: row.enabled,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  };
}

function defaultDevRows(companyId: string): VoiceStandardResponseRow[] {
  const now = new Date().toISOString();
  return DEFAULT_VOICE_STANDARD_RESPONSES.map((item, index) => ({
    id: `dev-vsr-${companyId}-${index}`,
    company_id: companyId,
    trigger_text: item.triggerText,
    response_text: item.responseText,
    category: item.category,
    enabled: item.enabled,
    sort_order: item.sortOrder,
    created_at: now,
    updated_at: now,
  }));
}

function requireAdminClient() {
  const admin = createAdminClient();
  if (!admin) {
    throw new VoiceStandardResponsesError(
      "Supabase Admin-Client nicht konfiguriert. Bitte SUPABASE_SERVICE_ROLE_KEY prüfen."
    );
  }
  return admin;
}

function mapPostgresError(error: { message: string; code?: string }): string {
  if (error.code === "42P01") {
    return "Tabelle voice_standard_responses fehlt. Bitte Migration in Supabase ausführen.";
  }
  return error.message;
}

export async function listVoiceStandardResponses(
  companyId: string
): Promise<VoiceStandardResponse[]> {
  if (!isSupabaseAdminConfigured()) {
    if (!devResponses.has(companyId)) {
      devResponses.set(companyId, defaultDevRows(companyId));
    }
    return (devResponses.get(companyId) ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(rowToResponse);
  }

  const admin = requireAdminClient();

  const { data, error } = await admin
    .from("voice_standard_responses")
    .select("*")
    .eq("company_id", companyId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new VoiceStandardResponsesError(mapPostgresError(error));
  }

  if (!data || data.length === 0) {
    return seedDefaultVoiceStandardResponses(companyId);
  }

  return (data as VoiceStandardResponseRow[]).map(rowToResponse);
}

export async function seedDefaultVoiceStandardResponses(
  companyId: string
): Promise<VoiceStandardResponse[]> {
  if (!isSupabaseAdminConfigured()) {
    devResponses.set(companyId, defaultDevRows(companyId));
    return listVoiceStandardResponses(companyId);
  }

  const admin = requireAdminClient();

  const insertRows = DEFAULT_VOICE_STANDARD_RESPONSES.map((item) => ({
    company_id: companyId,
    trigger_text: item.triggerText,
    response_text: item.responseText,
    category: item.category,
    enabled: item.enabled,
    sort_order: item.sortOrder,
  }));

  const { error } = await admin.from("voice_standard_responses").insert(insertRows);

  if (error) {
    throw new VoiceStandardResponsesError(mapPostgresError(error));
  }

  return listVoiceStandardResponses(companyId);
}

export async function upsertVoiceStandardResponse(
  companyId: string,
  input: {
    id?: string;
    triggerText: string;
    responseText: string;
    category: VoiceStandardResponseCategory;
    enabled: boolean;
    sortOrder?: number;
  }
): Promise<VoiceStandardResponse> {
  const triggerText = input.triggerText.trim();
  const responseText = input.responseText.trim();

  if (!triggerText || !responseText) {
    throw new VoiceStandardResponsesError("Trigger und Antwort dürfen nicht leer sein.");
  }

  const now = new Date().toISOString();

  if (!isSupabaseAdminConfigured()) {
    const store = [...(devResponses.get(companyId) ?? defaultDevRows(companyId))];

    if (input.id && !isDraftOrDevId(input.id)) {
      const index = store.findIndex((row) => row.id === input.id);
      if (index < 0) {
        throw new VoiceStandardResponsesError("Standard-Antwort nicht gefunden.");
      }
      store[index] = {
        ...store[index],
        trigger_text: triggerText,
        response_text: responseText,
        category: input.category,
        enabled: input.enabled,
        sort_order: input.sortOrder ?? store[index].sort_order,
        updated_at: now,
      };
      devResponses.set(companyId, store);
      return rowToResponse(store[index]);
    }

    const created: VoiceStandardResponseRow = {
      id: `dev-vsr-${companyId}-${Date.now()}`,
      company_id: companyId,
      trigger_text: triggerText,
      response_text: responseText,
      category: input.category,
      enabled: input.enabled,
      sort_order: input.sortOrder ?? store.length + 1,
      created_at: now,
      updated_at: now,
    };
    store.push(created);
    devResponses.set(companyId, store);
    return rowToResponse(created);
  }

  const admin = requireAdminClient();

  if (input.id && !isDraftOrDevId(input.id)) {
    const { data, error } = await admin
      .from("voice_standard_responses")
      .update({
        trigger_text: triggerText,
        response_text: responseText,
        category: input.category,
        enabled: input.enabled,
        sort_order: input.sortOrder,
        updated_at: now,
      })
      .eq("id", input.id)
      .eq("company_id", companyId)
      .select("*")
      .maybeSingle();

    if (error) {
      throw new VoiceStandardResponsesError(mapPostgresError(error));
    }
    if (!data) {
      throw new VoiceStandardResponsesError("Standard-Antwort nicht gefunden.");
    }

    return rowToResponse(data as VoiceStandardResponseRow);
  }

  const { data, error } = await admin
    .from("voice_standard_responses")
    .insert({
      company_id: companyId,
      trigger_text: triggerText,
      response_text: responseText,
      category: input.category,
      enabled: input.enabled,
      sort_order: input.sortOrder ?? 99,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new VoiceStandardResponsesError(
      error ? mapPostgresError(error) : "Speichern fehlgeschlagen."
    );
  }

  return rowToResponse(data as VoiceStandardResponseRow);
}

export async function deleteVoiceStandardResponse(
  companyId: string,
  responseId: string
): Promise<void> {
  if (isDraftOrDevId(responseId)) {
    throw new VoiceStandardResponsesError("Ungültige Standard-Antwort-ID.");
  }

  if (!isSupabaseAdminConfigured()) {
    const store = devResponses.get(companyId) ?? [];
    devResponses.set(
      companyId,
      store.filter((row) => row.id !== responseId)
    );
    return;
  }

  const admin = requireAdminClient();

  const { error } = await admin
    .from("voice_standard_responses")
    .delete()
    .eq("id", responseId)
    .eq("company_id", companyId);

  if (error) {
    throw new VoiceStandardResponsesError(mapPostgresError(error));
  }
}

export async function listActiveVoiceStandardResponsesForPrompt(
  companyId: string
): Promise<Array<{ triggerText: string; responseText: string }>> {
  const responses = await listVoiceStandardResponses(companyId);
  return responses
    .filter((item) => item.enabled)
    .map((item) => ({
      triggerText: item.triggerText,
      responseText: item.responseText,
    }));
}
