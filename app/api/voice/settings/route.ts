import { NextResponse } from "next/server";
import {
  createDevVoiceContext,
  requireVoiceContext,
} from "@/lib/voice/require-voice-context";
import {
  getVoiceSettings,
  updateVoiceSettings,
} from "@/lib/voice/voice-settings-repository";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireVoiceContext();
  const context = auth.ok ? auth.context : createDevVoiceContext();

  if (!auth.ok && isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const settings = await getVoiceSettings(context.companyId);
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const auth = await requireVoiceContext();
  const context = auth.ok ? auth.context : createDevVoiceContext();

  if (!auth.ok && isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as Record<string, unknown>;

  const settings = await updateVoiceSettings(context.companyId, {
    enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
    provider:
      body.provider === "mock" ||
      body.provider === "simulation" ||
      body.provider === "twilio" ||
      body.provider === "telnyx" ||
      body.provider === "teams" ||
      body.provider === "sip"
        ? body.provider
        : undefined,
    phoneNumber:
      typeof body.phoneNumber === "string" ? body.phoneNumber : undefined,
    greetingText:
      typeof body.greetingText === "string" ? body.greetingText : undefined,
    disclosureText:
      typeof body.disclosureText === "string" ? body.disclosureText : undefined,
    businessHours: Array.isArray(body.businessHours)
      ? (body.businessHours as import("@/features/voice/types/voice-types").VoiceSettings["businessHours"])
      : undefined,
  });

  return NextResponse.json({ settings });
}
