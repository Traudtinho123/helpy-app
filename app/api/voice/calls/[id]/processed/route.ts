import { NextResponse } from "next/server";
import { getVoiceCallProcessedPayload } from "@/lib/voice/voice-call-repository";
import {
  createDevVoiceContext,
  requireVoiceContext,
} from "@/lib/voice/require-voice-context";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireVoiceContext();
  const voiceContext = auth.ok ? auth.context : createDevVoiceContext();

  if (!auth.ok && isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const processed = await getVoiceCallProcessedPayload(id, voiceContext.companyId);

  if (!processed) {
    return NextResponse.json({ error: "Kein Vorgang für diesen Anruf." }, { status: 404 });
  }

  return NextResponse.json({ processed });
}
