import { NextResponse } from "next/server";
import {
  createDevVoiceContext,
  requireVoiceContext,
} from "@/lib/voice/require-voice-context";
import { listVoiceCallsForCompany } from "@/lib/voice/voice-call-repository";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireVoiceContext();
  const context = auth.ok ? auth.context : createDevVoiceContext();

  if (!auth.ok && isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const calls = await listVoiceCallsForCompany(context.companyId, 20);
  return NextResponse.json({ calls });
}
