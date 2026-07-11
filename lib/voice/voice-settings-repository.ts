import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { VoiceSettingsInsert, VoiceSettingsRow as DbVoiceSettingsRow } from "@/lib/database/types";
import {
  DEFAULT_VOICE_DISCLOSURE,
  DEFAULT_VOICE_GREETING,
  type VoiceSettings,
} from "@/features/voice/types/voice-types";

type VoiceSettingsRow = DbVoiceSettingsRow;

const devSettings = new Map<string, VoiceSettingsRow>();

function rowToSettings(row: VoiceSettingsRow): VoiceSettings {
  return {
    companyId: row.company_id,
    enabled: row.enabled,
    provider: (row.provider as VoiceSettings["provider"]) ?? "simulation",
    phoneNumber: row.phone_number,
    greetingText: row.greeting_text,
    disclosureText: row.disclosure_text,
    businessHours: Array.isArray(row.business_hours)
      ? (row.business_hours as VoiceSettings["businessHours"])
      : null,
    updatedAt: row.updated_at,
  };
}

function defaultRow(companyId: string): VoiceSettingsRow {
  const now = new Date().toISOString();
  return {
    company_id: companyId,
    enabled: false,
    provider: "simulation",
    phone_number: null,
    greeting_text: DEFAULT_VOICE_GREETING,
    disclosure_text: DEFAULT_VOICE_DISCLOSURE,
    business_hours: null,
    created_at: now,
    updated_at: now,
  };
}

export async function getVoiceSettings(companyId: string): Promise<VoiceSettings> {
  if (!isSupabaseAdminConfigured()) {
    const row = devSettings.get(companyId) ?? defaultRow(companyId);
    if (!devSettings.has(companyId)) {
      devSettings.set(companyId, row);
    }
    return rowToSettings(row);
  }

  const admin = createAdminClient();
  if (!admin) return rowToSettings(defaultRow(companyId));

  const { data, error } = await admin
    .from("voice_settings")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) {
    console.error("[voice] load settings failed:", error.message);
    return rowToSettings(defaultRow(companyId));
  }

  if (!data) {
    const row = defaultRow(companyId);
    await admin.from("voice_settings").insert(row as VoiceSettingsInsert);
    return rowToSettings(row);
  }

  return rowToSettings(data as VoiceSettingsRow);
}

export type VoiceSettingsUpdateResult =
  | { ok: true; settings: VoiceSettings }
  | { ok: false; error: string };

export async function updateVoiceSettings(
  companyId: string,
  patch: Partial<
    Pick<
      VoiceSettings,
      | "enabled"
      | "provider"
      | "phoneNumber"
      | "greetingText"
      | "disclosureText"
      | "businessHours"
    >
  >
): Promise<VoiceSettingsUpdateResult> {
  const current = await getVoiceSettings(companyId);
  const nextRow: VoiceSettingsInsert = {
    company_id: companyId,
    enabled: patch.enabled ?? current.enabled,
    provider: patch.provider ?? current.provider,
    phone_number:
      patch.phoneNumber !== undefined ? patch.phoneNumber : current.phoneNumber,
    greeting_text: patch.greetingText?.trim() || current.greetingText,
    disclosure_text: patch.disclosureText?.trim() || current.disclosureText,
    business_hours: patch.businessHours ?? current.businessHours,
    updated_at: new Date().toISOString(),
  };

  console.log("[voice/settings/patch] updateVoiceSettings", {
    companyId,
    currentProvider: current.provider,
    currentEnabled: current.enabled,
    nextProvider: nextRow.provider,
    nextEnabled: nextRow.enabled,
    adminConfigured: isSupabaseAdminConfigured(),
  });

  if (!isSupabaseAdminConfigured()) {
    console.log("[voice/settings/patch] dev fallback — in-memory only (no service role)");
    devSettings.set(companyId, {
      ...defaultRow(companyId),
      ...nextRow,
      updated_at: nextRow.updated_at ?? new Date().toISOString(),
    });
    return { ok: true, settings: rowToSettings(devSettings.get(companyId)!) };
  }

  const admin = createAdminClient();
  if (!admin) {
    console.log("[voice/settings/patch] createAdminClient returned null");
    return {
      ok: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY fehlt — Voice-Einstellungen können auf dem Server nicht gespeichert werden.",
    };
  }

  const { data: upsertData, error } = await admin.from("voice_settings").upsert(nextRow, {
    onConflict: "company_id",
  }).select();

  console.log("[voice/settings/patch] supabase upsert", {
    error: error?.message ?? null,
    errorCode: error?.code ?? null,
    errorDetails: error?.details ?? null,
    upsertRowCount: upsertData?.length ?? 0,
    upsertProvider: upsertData?.[0]?.provider ?? null,
    upsertEnabled: upsertData?.[0]?.enabled ?? null,
  });

  if (error) {
    console.error("[voice] update settings failed:", error.message);
    return {
      ok: false,
      error: `Speichern fehlgeschlagen: ${error.message}. Prüfe SUPABASE_SERVICE_ROLE_KEY und Migration voice_settings.`,
    };
  }

  const { data, error: readError } = await admin
    .from("voice_settings")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  console.log("[voice/settings/patch] supabase read-after-upsert", {
    error: readError?.message ?? null,
    provider: data?.provider ?? null,
    enabled: data?.enabled ?? null,
    found: Boolean(data),
  });

  if (readError || !data) {
    console.error("[voice] read settings after update failed:", readError?.message);
    return {
      ok: false,
      error: "Einstellungen konnten nach dem Speichern nicht bestätigt werden.",
    };
  }

  return { ok: true, settings: rowToSettings(data as VoiceSettingsRow) };
}
