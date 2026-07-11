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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;

  const result = await updateVoiceSettings(context.companyId, {
    enabled: typeof payload.enabled === "boolean" ? payload.enabled : undefined,
    provider:
      payload.provider === "mock" ||
      payload.provider === "simulation" ||
      payload.provider === "twilio" ||
      payload.provider === "telnyx" ||
      payload.provider === "teams" ||
      payload.provider === "sip"
        ? payload.provider
        : undefined,
    phoneNumber:
      typeof payload.phoneNumber === "string" ? payload.phoneNumber : undefined,
    greetingText:
      typeof payload.greetingText === "string" ? payload.greetingText : undefined,
    disclosureText:
      typeof payload.disclosureText === "string" ? payload.disclosureText : undefined,
    businessHours: Array.isArray(payload.businessHours)
      ? (payload.businessHours as import("@/features/voice/types/voice-types").VoiceSettings["businessHours"])
      : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 503 });
  }

  return NextResponse.json({ settings: result.settings });
}
