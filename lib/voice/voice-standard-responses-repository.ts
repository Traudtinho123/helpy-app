import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import {
  DEFAULT_VOICE_STANDARD_RESPONSES,
  type VoiceStandardResponse,
  type VoiceStandardResponseCategory,
} from "@/features/voice/types/voice-standard-response-types";

type VoiceStandardResponseRow = {
  id: string;
  company_id: string;
  trigger_text: string;
  response_text: string;
  category: string;
  enabled: boolean;
  sort_order: number;
  updated_at: string;
};

const devResponses = new Map<string, VoiceStandardResponseRow[]>();

function standardResponsesTable(admin: NonNullable<ReturnType<typeof createAdminClient>>) {
  return (
    admin as unknown as {
      from: (table: string) => ReturnType<typeof admin.from>;
    }
  ).from("voice_standard_responses");
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
    updated_at: now,
  }));
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

  const admin = createAdminClient();
  if (!admin) {
    return defaultDevRows(companyId).map(rowToResponse);
  }

  const { data, error } = await standardResponsesTable(admin)
    .select("*")
    .eq("company_id", companyId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[voice] list standard responses failed:", error.message);
    return defaultDevRows(companyId).map(rowToResponse);
  }

  if (!data || data.length === 0) {
    return seedDefaultVoiceStandardResponses(companyId);
  }

  return (data as unknown as VoiceStandardResponseRow[]).map(rowToResponse);
}

export async function seedDefaultVoiceStandardResponses(
  companyId: string
): Promise<VoiceStandardResponse[]> {
  if (!isSupabaseAdminConfigured()) {
    devResponses.set(companyId, defaultDevRows(companyId));
    return listVoiceStandardResponses(companyId);
  }

  const admin = createAdminClient();
  if (!admin) return defaultDevRows(companyId).map(rowToResponse);

  const insertRows = DEFAULT_VOICE_STANDARD_RESPONSES.map((item) => ({
    company_id: companyId,
    trigger_text: item.triggerText,
    response_text: item.responseText,
    category: item.category,
    enabled: item.enabled,
    sort_order: item.sortOrder,
  }));

  const { error } = await standardResponsesTable(admin).insert(insertRows);
  if (error) {
    console.error("[voice] seed standard responses failed:", error.message);
    return defaultDevRows(companyId).map(rowToResponse);
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
): Promise<VoiceStandardResponse | null> {
  const now = new Date().toISOString();

  if (!isSupabaseAdminConfigured()) {
    const store = devResponses.get(companyId) ?? defaultDevRows(companyId);
    if (input.id) {
      const index = store.findIndex((row) => row.id === input.id);
      if (index >= 0) {
        store[index] = {
          ...store[index],
          trigger_text: input.triggerText.trim(),
          response_text: input.responseText.trim(),
          category: input.category,
          enabled: input.enabled,
          sort_order: input.sortOrder ?? store[index].sort_order,
          updated_at: now,
        };
      }
    } else {
      store.push({
        id: `dev-vsr-${companyId}-${Date.now()}`,
        company_id: companyId,
        trigger_text: input.triggerText.trim(),
        response_text: input.responseText.trim(),
        category: input.category,
        enabled: input.enabled,
        sort_order: input.sortOrder ?? store.length + 1,
        updated_at: now,
      });
    }
    devResponses.set(companyId, store);
    return rowToResponse(store.find((row) => row.updated_at === now) ?? store.at(-1)!);
  }

  const admin = createAdminClient();
  if (!admin) return null;

  if (input.id) {
    const { data, error } = await standardResponsesTable(admin)
      .update({
        trigger_text: input.triggerText.trim(),
        response_text: input.responseText.trim(),
        category: input.category,
        enabled: input.enabled,
        sort_order: input.sortOrder,
        updated_at: now,
      })
      .eq("id", input.id)
      .eq("company_id", companyId)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      console.error("[voice] update standard response failed:", error?.message);
      return null;
    }

    return rowToResponse(data as unknown as VoiceStandardResponseRow);
  }

  const { data, error } = await standardResponsesTable(admin)
    .insert({
      company_id: companyId,
      trigger_text: input.triggerText.trim(),
      response_text: input.responseText.trim(),
      category: input.category,
      enabled: input.enabled,
      sort_order: input.sortOrder ?? 99,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[voice] create standard response failed:", error?.message);
    return null;
  }

  return rowToResponse(data as VoiceStandardResponseRow);
}

export async function deleteVoiceStandardResponse(
  companyId: string,
  responseId: string
): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) {
    const store = devResponses.get(companyId) ?? [];
    devResponses.set(
      companyId,
      store.filter((row) => row.id !== responseId)
    );
    return true;
  }

  const admin = createAdminClient();
  if (!admin) return false;

  const { error } = await standardResponsesTable(admin)
    .delete()
    .eq("id", responseId)
    .eq("company_id", companyId);

  if (error) {
    console.error("[voice] delete standard response failed:", error.message);
    return false;
  }

  return true;
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
