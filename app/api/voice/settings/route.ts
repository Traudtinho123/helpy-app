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

  console.log("[voice/settings/patch] auth", {
    ok: auth.ok,
    companyId: context.companyId,
    userId: context.userId,
    adminConfigured: isSupabaseAdminConfigured(),
    serviceRoleKeyPresent: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    serviceRoleKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().slice(0, 12) ?? null,
  });

  if (!auth.ok && isSupabaseAdminConfigured()) {
    console.log("[voice/settings/patch] rejected — not authenticated", auth.error);
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

  const patch = {
    enabled: typeof payload.enabled === "boolean" ? payload.enabled : undefined,
    provider:
      payload.provider === "mock" ||
      payload.provider === "simulation" ||
      payload.provider === "twilio" ||
      payload.provider === "telnyx" ||
      payload.provider === "teams" ||
      payload.provider === "sip"
        ? (payload.provider as import("@/features/voice/types/voice-types").VoiceSettings["provider"])
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
  };

  console.log("[voice/settings/patch] incoming body", payload);
  console.log("[voice/settings/patch] normalized patch", patch);

  const result = await updateVoiceSettings(context.companyId, patch);

  console.log("[voice/settings/patch] result", {
    ok: result.ok,
    error: result.ok ? null : result.error,
    provider: result.ok ? result.settings.provider : null,
    enabled: result.ok ? result.settings.enabled : null,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 503 });
  }

  return NextResponse.json({ settings: result.settings });
}
