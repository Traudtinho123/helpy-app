import { NextResponse } from "next/server";
import { ackVoiceIntakes } from "@/lib/voice/voice-call-repository";
import {
  createDevVoiceContext,
  requireVoiceContext,
} from "@/lib/voice/require-voice-context";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await requireVoiceContext();
  const context = auth.ok ? auth.context : createDevVoiceContext();

  if (!auth.ok && isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Ungültiger Request-Body." },
      { status: 400 }
    );
  }

  const callIds = Array.isArray((body as { callIds?: unknown }).callIds)
    ? (body as { callIds: string[] }).callIds
    : [];

  if (callIds.length === 0) {
    return NextResponse.json({ ok: false, error: "Keine callIds." }, { status: 400 });
  }

  const acked = await ackVoiceIntakes(context.companyId, callIds);
  return NextResponse.json({ ok: true, acked });
}
