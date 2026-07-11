import { NextResponse } from "next/server";
import { runMockConversationServer } from "@/features/voice/voice-core/voice-core.server";
import type { VoiceSimulateRequest } from "@/features/voice/types/voice-types";
import {
  createDevVoiceContext,
  requireVoiceContext,
} from "@/lib/voice/require-voice-context";
import { createVoiceCall, updateVoiceCall } from "@/lib/voice/voice-call-repository";
import { getVoiceSettings } from "@/lib/voice/voice-settings-repository";
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

  const payload = body as VoiceSimulateRequest;
  const transcript = payload.transcript?.trim();

  if (!transcript || transcript.length < 8) {
    return NextResponse.json(
      { ok: false, error: "Bitte ein Transkript mit mindestens 8 Zeichen angeben." },
      { status: 400 }
    );
  }

  const settings = await getVoiceSettings(context.companyId);
  if (!settings.enabled) {
    return NextResponse.json(
      {
        ok: false,
        error: "Voice Core ist deaktiviert. Bitte zuerst unter Telefonie aktivieren.",
      },
      { status: 403 }
    );
  }

  const startedAt = new Date().toISOString();
  const call = await createVoiceCall(context.companyId, {
    callerPhone: payload.callerPhone ?? "+41 79 000 00 00",
    callerName: payload.callerName ?? null,
    status: "in_progress",
    startedAt,
  });

  const { processed, conversation } = runMockConversationServer({
    transcript,
    call,
    callerName: payload.callerName,
    callerPhone: payload.callerPhone,
    providerId: "mock",
  });

  const saved = await updateVoiceCall(processed.call.id, {
    status: "completed",
    transcript,
    summary: processed.call.summary,
    intent: processed.call.intent,
    vorgang_id: processed.vorgangId,
    duration_seconds: payload.durationSeconds ?? 45,
    ended_at: processed.call.endedAt,
  });

  return NextResponse.json({
    ok: true,
    result: {
      ...processed,
      call: saved ?? processed.call,
    },
    conversationId: conversation.conversationId,
  });
}
