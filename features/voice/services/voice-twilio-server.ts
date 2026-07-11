import {
  buildVoiceAppointmentAssistantReply,
  isVoiceAppointmentIntent,
} from "@/features/voice/services/voice-appointment-engine";
import { buildAssistantReply } from "@/features/voice/services/voice-intent-engine";
import { processVoiceCall } from "@/features/voice/services/voice-call-processor";
import type {
  VoiceIntent,
  VoiceProcessedCall,
} from "@/features/voice/types/voice-types";
import {
  createVoiceCall,
  findVoiceCallByExternalId,
  updateVoiceCall,
} from "@/lib/voice/voice-call-repository";
import type { Json } from "@/lib/database/types";

function buildTwilioAssistantReply(
  processed: VoiceProcessedCall,
  transcript: string
): string {
  const intent = processed.call.intent ?? "sonstiges";
  if (isVoiceAppointmentIntent(intent as VoiceIntent)) {
    const appointmentReply = buildVoiceAppointmentAssistantReply({
      intent: intent as VoiceIntent,
      callerName: processed.call.callerName,
      suggestion: null,
    });
    if (appointmentReply) return appointmentReply;
  }
  return (
    processed.assistantReply ||
    buildAssistantReply(intent as VoiceIntent, processed.call.callerName ?? undefined)
  );
}

export async function ensureTwilioCallRecord(input: {
  companyId: string;
  callSid: string;
  callerPhone?: string | null;
}): Promise<{ callId: string; created: boolean }> {
  const existing = await findVoiceCallByExternalId(input.callSid);
  if (existing) {
    return { callId: existing.id, created: false };
  }

  const call = await createVoiceCall(input.companyId, {
    externalCallId: input.callSid,
    callerPhone: input.callerPhone ?? null,
    status: "ringing",
    startedAt: new Date().toISOString(),
  });

  return { callId: call.id, created: true };
}

export async function processTwilioSpeechResult(input: {
  companyId: string;
  callSid: string;
  callerPhone?: string | null;
  speechResult: string;
}): Promise<{ reply: string; processed: VoiceProcessedCall | null }> {
  const transcript = input.speechResult.trim();
  if (transcript.length < 3) {
    return { reply: "", processed: null };
  }

  const { callId: _callId } = await ensureTwilioCallRecord(input);
  const callRecord =
    (await findVoiceCallByExternalId(input.callSid)) ??
    (await createVoiceCall(input.companyId, {
      externalCallId: input.callSid,
      callerPhone: input.callerPhone ?? null,
      status: "in_progress",
    }));

  await updateVoiceCall(callRecord.id, {
    status: "in_progress",
    caller_phone: input.callerPhone ?? callRecord.callerPhone,
  });

  const processed = processVoiceCall({
    call: { ...callRecord, status: "in_progress" },
    transcript,
  });

  const reply = buildTwilioAssistantReply(processed, transcript);
  const completedCall: VoiceProcessedCall = {
    ...processed,
    assistantReply: reply,
    call: {
      ...processed.call,
      status: "completed",
      transcript,
      endedAt: new Date().toISOString(),
    },
  };

  await updateVoiceCall(callRecord.id, {
    status: "completed",
    transcript,
    summary: completedCall.call.summary,
    intent: completedCall.call.intent,
    vorgang_id: completedCall.vorgangId,
    assistant_reply: reply,
    processed_payload: completedCall as unknown as Json,
    ended_at: completedCall.call.endedAt,
  });

  return { reply, processed: completedCall };
}

export async function updateTwilioCallStatus(input: {
  callSid: string;
  callStatus: string;
  durationSeconds?: number | null;
}): Promise<void> {
  const call = await findVoiceCallByExternalId(input.callSid);
  if (!call) return;

  const normalized = input.callStatus.toLowerCase();
  let status = call.status;

  if (normalized === "completed") {
    status = call.transcript ? "completed" : "missed";
  } else if (normalized === "busy" || normalized === "failed" || normalized === "no-answer") {
    status = "failed";
  } else if (normalized === "ringing" || normalized === "in-progress") {
    status = "in_progress";
  }

  await updateVoiceCall(call.id, {
    status,
    duration_seconds: input.durationSeconds ?? call.durationSeconds,
    ended_at:
      normalized === "completed" ? new Date().toISOString() : call.endedAt,
  });
}
