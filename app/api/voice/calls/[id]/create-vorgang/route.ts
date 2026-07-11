import { NextResponse } from "next/server";
import { detectVoiceCallClassification } from "@/features/voice/services/voice-intent-engine";
import { buildVoiceProcessedCallFromRecord } from "@/features/voice/services/voice-vorgang-factory";
import {
  buildHelpyPhoneVorgangCreateInput,
  createVorgang,
} from "@/lib/vorgaenge/create-vorgang";
import {
  createDevVoiceContext,
  requireVoiceContext,
} from "@/lib/voice/require-voice-context";
import {
  getVoiceCallById,
  updateVoiceCall,
} from "@/lib/voice/voice-call-repository";
import { flattenVoiceTranscript } from "@/lib/voice/voice-call-session-store";
import { normalizeTranscriptTurns } from "@/lib/voice/voice-call-transcript";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { Json } from "@/lib/database/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireVoiceContext();
  const voiceContext = auth.ok ? auth.context : createDevVoiceContext();

  if (!auth.ok && isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await context.params;
  const call = await getVoiceCallById(id);

  if (!call || call.companyId !== voiceContext.companyId) {
    return NextResponse.json({ error: "Anruf nicht gefunden." }, { status: 404 });
  }

  if (call.vorgangId) {
    return NextResponse.json({
      ok: true,
      alreadyExists: true,
      vorgangId: call.vorgangId,
    });
  }

  const turns = normalizeTranscriptTurns(call.transcriptTurns);
  const transcript =
    turns.length > 0
      ? flattenVoiceTranscript(turns)
      : call.transcript?.trim() ?? "";

  if (transcript.length < 8) {
    return NextResponse.json(
      { error: "Transkript zu kurz — Vorgang kann nicht erstellt werden." },
      { status: 400 }
    );
  }

  const classification =
    call.classification ?? detectVoiceCallClassification(transcript);

  const vorgangResult = await createVorgang(
    buildHelpyPhoneVorgangCreateInput({
      companyId: voiceContext.companyId,
      callId: call.id,
      classification,
      summary: call.summary?.trim() || transcript.slice(0, 280),
      callerNumber: call.callerPhone,
      terminDatum: call.terminDatum ?? null,
      terminUhrzeit: call.terminUhrzeit ?? null,
    })
  );

  const processed = buildVoiceProcessedCallFromRecord({
    call: { ...call, vorgangId: vorgangResult.id },
    transcript,
    classification,
    callerName: call.callerName,
    requestedDateTime: call.requestedDateTime ?? null,
    summaryOverride: call.summary,
    autoCreated: false,
  });

  await updateVoiceCall(call.id, {
    vorgang_id: vorgangResult.id,
    summary: call.summary ?? processed.liste.summary,
    intent: processed.call.intent,
    processed_payload: processed as unknown as Json,
  });

  return NextResponse.json({
    ok: true,
    vorgangId: vorgangResult.id,
    processed,
  });
}
