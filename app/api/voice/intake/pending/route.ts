import { NextResponse } from "next/server";
import { listPendingVoiceIntakes } from "@/lib/voice/voice-call-repository";
import {
  createDevVoiceContext,
  requireVoiceContext,
} from "@/lib/voice/require-voice-context";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireVoiceContext();
  const context = auth.ok ? auth.context : createDevVoiceContext();

  if (!auth.ok && isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const intakes = await listPendingVoiceIntakes(context.companyId, 20);
  return NextResponse.json({ intakes });
}
