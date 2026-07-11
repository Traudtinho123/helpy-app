import { NextResponse } from "next/server";
import { flattenVoiceTranscript } from "@/lib/voice/voice-call-session-store";
import {
  createDevVoiceContext,
  requireVoiceContext,
} from "@/lib/voice/require-voice-context";
import {
  getVoiceCallById,
  updateVoiceCall,
} from "@/lib/voice/voice-call-repository";
import { loadVoiceCallPromptContext } from "@/lib/voice/voice-call-prompt-context";
import { generateHelpyCallSummary } from "@/lib/voice/openai-voice-assistant";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

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

  if (call.summary?.trim()) {
    return NextResponse.json({ summary: call.summary.trim() });
  }

  const transcript =
    call.transcript?.trim() ||
    flattenVoiceTranscript(call.transcriptTurns ?? []);

  if (transcript.length < 8) {
    return NextResponse.json(
      { error: "Transkript zu kurz für eine Zusammenfassung." },
      { status: 400 }
    );
  }

  const promptContext = await loadVoiceCallPromptContext(voiceContext.companyId);
  const summary = await generateHelpyCallSummary({
    systemContext: promptContext.systemContext,
    transcript,
  });

  if (!summary.trim()) {
    return NextResponse.json(
      { error: "Zusammenfassung konnte nicht erstellt werden." },
      { status: 502 }
    );
  }

  await updateVoiceCall(call.id, { summary: summary.trim() });

  return NextResponse.json({ summary: summary.trim() });
}
