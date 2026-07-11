import { NextResponse } from "next/server";
import { VOICE_INTENT_LABELS } from "@/features/voice/types/voice-types";
import { maskPhoneNumber } from "@/lib/voice/mask-phone";
import {
  createDevVoiceContext,
  requireVoiceContext,
} from "@/lib/voice/require-voice-context";
import {
  getVoiceCallStatsForCompany,
  getVoiceIntentStatsForCompany,
  listVoiceCallsForCompany,
} from "@/lib/voice/voice-call-repository";
import { loadVoiceCompanyContext } from "@/lib/voice/voice-company-context";
import { getVoiceSettings } from "@/lib/voice/voice-settings-repository";
import { getTwilioConfig, isTwilioConfigured } from "@/lib/voice/twilio-env";
import { isOpenAiConfigured } from "@/lib/voice/openai-voice-assistant";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

function formatDisplayPhone(phone: string | null): string {
  if (!phone?.trim()) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone.trim();
}

export async function GET() {
  const auth = await requireVoiceContext();
  const context = auth.ok ? auth.context : createDevVoiceContext();

  if (!auth.ok && isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [settings, stats, intents, company] = await Promise.all([
    getVoiceSettings(context.companyId),
    getVoiceCallStatsForCompany(context.companyId),
    getVoiceIntentStatsForCompany(context.companyId),
    loadVoiceCompanyContext(context.companyId),
  ]);

  const twilioConfig = getTwilioConfig();
  const phoneNumber = twilioConfig?.phoneNumber ?? settings.phoneNumber;
  const ready =
    isTwilioConfigured() &&
    isOpenAiConfigured() &&
    settings.enabled &&
    settings.provider === "twilio";

  return NextResponse.json({
    companyName: company.companyName,
    connection: {
      twilioConfigured: isTwilioConfigured(),
      openAiConfigured: isOpenAiConfigured(),
      voiceEnabled: settings.enabled,
      provider: settings.provider,
      phoneNumber,
      phoneNumberDisplay: formatDisplayPhone(phoneNumber),
      ready,
      connectedSince: settings.updatedAt,
    },
    numbers: phoneNumber
      ? [
          {
            phoneNumber,
            phoneNumberDisplay: formatDisplayPhone(phoneNumber),
            provider: settings.provider,
            providerLabel: "Twilio",
            active: ready,
            companyName: company.companyName,
            connectedSince: settings.updatedAt,
            stats: {
              today: stats.today,
              thisWeek: stats.thisWeek,
              total: stats.total,
            },
          },
        ]
      : [],
    stats: {
      today: stats.today,
      thisWeek: stats.thisWeek,
      total: stats.total,
      avgDurationSeconds: stats.avgDurationSeconds,
    },
    intentStats: intents,
  });
}
