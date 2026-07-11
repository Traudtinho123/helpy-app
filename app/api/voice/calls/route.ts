import { NextResponse } from "next/server";
import { VOICE_INTENT_LABELS } from "@/features/voice/types/voice-types";
import { maskPhoneNumber } from "@/lib/voice/mask-phone";
import {
  createDevVoiceContext,
  requireVoiceContext,
} from "@/lib/voice/require-voice-context";
import {
  getVoiceCallStatsForCompany,
  listVoiceCallsForCompany,
} from "@/lib/voice/voice-call-repository";
import { getVoiceSettings } from "@/lib/voice/voice-settings-repository";
import { getTwilioConfig, isTwilioConfigured } from "@/lib/voice/twilio-env";
import { isOpenAiConfigured } from "@/lib/voice/openai-voice-assistant";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireVoiceContext();
  const context = auth.ok ? auth.context : createDevVoiceContext();

  if (!auth.ok && isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const [calls, stats, settings] = await Promise.all([
    listVoiceCallsForCompany(context.companyId, 50),
    getVoiceCallStatsForCompany(context.companyId),
    getVoiceSettings(context.companyId),
  ]);

  const twilioConfig = getTwilioConfig();
  const connection = {
    twilioConfigured: isTwilioConfigured(),
    openAiConfigured: isOpenAiConfigured(),
    voiceEnabled: settings.enabled,
    provider: settings.provider,
    phoneNumber: twilioConfig?.phoneNumber ?? settings.phoneNumber,
    ready:
      isTwilioConfigured() &&
      isOpenAiConfigured() &&
      settings.enabled &&
      settings.provider === "twilio",
  };

  return NextResponse.json({
    connection,
    stats,
    calls: calls.map((call) => ({
      ...call,
      callerPhoneMasked: maskPhoneNumber(call.callerPhone),
      intentLabel: call.intent ? VOICE_INTENT_LABELS[call.intent] : null,
      workflowStatus: call.clientAckAt
        ? "erledigt"
        : call.hasPreparedVorgang
          ? "vorgang_vorbereitet"
          : call.status === "completed"
            ? "offen"
            : "offen",
    })),
  });
}
