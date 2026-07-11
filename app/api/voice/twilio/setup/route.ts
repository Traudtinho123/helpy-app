import { NextResponse } from "next/server";
import { formatBusinessHoursSummary } from "@/features/voice/services/voice-business-hours";
import {
  createDevVoiceContext,
  requireVoiceContext,
} from "@/lib/voice/require-voice-context";
import { getVoiceSettings } from "@/lib/voice/voice-settings-repository";
import {
  buildVoiceWebhookUrl,
  getTwilioConfig,
  isTwilioConfigured,
} from "@/lib/voice/twilio-env";
import { isOpenAiConfigured } from "@/lib/voice/openai-voice-assistant";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireVoiceContext();
  const context = auth.ok ? auth.context : createDevVoiceContext();

  if (!auth.ok && isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const twilioConfig = getTwilioConfig();
  const settings = await getVoiceSettings(context.companyId);
  const configured =
    isTwilioConfigured() && isOpenAiConfigured() && Boolean(twilioConfig?.phoneNumber);

  return NextResponse.json({
    configured,
    openAiConfigured: isOpenAiConfigured(),
    twilioConfigured: isTwilioConfigured(),
    voiceEnabled: settings.enabled,
    provider: settings.provider,
    companyId: context.companyId,
    phoneNumber: twilioConfig?.phoneNumber ?? settings.phoneNumber,
    webhooks: {
      incoming: buildVoiceWebhookUrl(
        "/api/voice/webhook/twilio/incoming",
        context.companyId
      ),
      gather: buildVoiceWebhookUrl(
        "/api/voice/webhook/twilio/gather",
        context.companyId
      ),
      status: buildVoiceWebhookUrl(
        "/api/voice/webhook/twilio/status",
        context.companyId
      ),
    },
    businessHoursSummary: formatBusinessHoursSummary(settings.businessHours ?? undefined),
  });
}
