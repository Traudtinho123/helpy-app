import { processVoiceCall } from "@/features/voice/services/voice-call-processor";
import {
  buildTwilioClosedTwiml,
  buildTwilioDisabledTwiml,
  buildTwilioGoodbyeTwiml,
  buildTwilioIncomingTwiml,
  buildTwilioNoSpeechTwiml,
  buildTwilioRateLimitTwiml,
  buildTwilioReplyAndGatherTwiml,
} from "@/features/voice/services/voice-twiml-builder";
import { isWithinBusinessHours } from "@/features/voice/services/voice-business-hours";
import {
  detectVoiceCallClassification,
  shouldCreateVoiceVorgang,
} from "@/features/voice/services/voice-intent-engine";
import type { Json } from "@/lib/database/types";
import {
  analyzeVoiceCallTranscript,
  generateHelpyCallSummary,
  generateHelpyPhoneReply,
  isOpenAiConfigured,
} from "@/lib/voice/openai-voice-assistant";
import { dispatchVoiceCallAlert } from "@/lib/voice/voice-call-alerts";
import {
  cacheVoiceCallPromptContext,
  clearVoiceCallPromptContext,
  loadVoiceCallPromptContext,
  resolveVoiceCallPromptContext,
} from "@/lib/voice/voice-call-prompt-context";
import { loadVoiceCompanyContext } from "@/lib/voice/voice-company-context";
import {
  appendVoiceCallTurn,
  createVoiceCallSession,
  deleteVoiceCallSession,
  flattenVoiceTranscript,
  getVoiceCallSession,
  shouldEndVoiceCall,
  upsertVoiceCallSession,
} from "@/lib/voice/voice-call-session-store";
import {
  createVoiceCall,
  findVoiceCallByExternalId,
  updateVoiceCall,
} from "@/lib/voice/voice-call-repository";
import { isVoiceRateLimitExceeded } from "@/lib/voice/voice-rate-limit";
import { getVoiceSettings } from "@/lib/voice/voice-settings-repository";
import { buildVoiceWebhookUrl, isTwilioConfigured } from "@/lib/voice/twilio-env";

function twimlResponse(xml: string): Response {
  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

function resolveCallSid(params: Record<string, string>): string | null {
  return params.CallSid?.trim() || null;
}

function resolveCallerPhone(params: Record<string, string>): string | null {
  return params.From?.trim() || params.Caller?.trim() || null;
}

export async function handleTwilioIncomingCall(
  companyId: string,
  params: Record<string, string>
): Promise<Response> {
  if (!isTwilioConfigured() || !isOpenAiConfigured()) {
    return twimlResponse(buildTwilioDisabledTwiml());
  }

  const settings = await getVoiceSettings(companyId);
  if (!settings.enabled || settings.provider !== "twilio") {
    return twimlResponse(buildTwilioDisabledTwiml());
  }

  if (!isWithinBusinessHours(settings)) {
    return twimlResponse(buildTwilioClosedTwiml());
  }

  if (await isVoiceRateLimitExceeded(companyId)) {
    return twimlResponse(buildTwilioRateLimitTwiml());
  }

  const callSid = resolveCallSid(params);
  if (!callSid) {
    return twimlResponse(buildTwilioDisabledTwiml());
  }

  const callerPhone = resolveCallerPhone(params);
  const existing = await findVoiceCallByExternalId(callSid);
  let dbCallId = existing?.id ?? null;

  if (!existing) {
    const created = await createVoiceCall(companyId, {
      externalCallId: callSid,
      callerPhone,
      status: "ringing",
      startedAt: new Date().toISOString(),
    });
    dbCallId = created.id;
  } else if (existing.status === "ringing" || existing.status === "in_progress") {
    await updateVoiceCall(existing.id, {
      status: "in_progress",
      caller_phone: callerPhone ?? existing.callerPhone,
    });
  }

  createVoiceCallSession({
    callSid,
    companyId,
    callerPhone,
    dbCallId,
  });

  const company = await loadVoiceCompanyContext(companyId);
  const promptContext = await loadVoiceCallPromptContext(companyId);
  cacheVoiceCallPromptContext(callSid, promptContext);
  const greetingText =
    settings.greetingText?.trim() ||
    `Herzlich willkommen bei ${company.greetingCompanyLine}. Wie kann ich Ihnen helfen?`;
  const disclosureText = settings.disclosureText?.trim();
  const spokenOpening = disclosureText
    ? `${greetingText} ${disclosureText}`
    : greetingText;

  appendVoiceCallTurn(callSid, {
    role: "helpy",
    text: spokenOpening,
    at: new Date().toISOString(),
  });

  if (dbCallId) {
    const session = getVoiceCallSession(callSid);
    await updateVoiceCall(dbCallId, {
      status: "in_progress",
      transcript: flattenVoiceTranscript(session?.turns ?? []),
      transcript_turns: (session?.turns ?? []) as unknown as Json,
    });
  }

  const gatherActionUrl = buildVoiceWebhookUrl(
    "/api/voice/webhook/twilio/gather",
    companyId
  );

  return twimlResponse(
    buildTwilioIncomingTwiml({
      companyName: company.greetingCompanyLine,
      settings,
      gatherActionUrl,
    })
  );
}

export async function handleTwilioGatherSpeech(
  companyId: string,
  params: Record<string, string>
): Promise<Response> {
  const callSid = resolveCallSid(params);
  if (!callSid) {
    return twimlResponse(buildTwilioDisabledTwiml());
  }

  const gatherActionUrl = buildVoiceWebhookUrl(
    "/api/voice/webhook/twilio/gather",
    companyId
  );

  const speechResult = params.SpeechResult?.trim() ?? "";
  if (speechResult.length < 2) {
    return twimlResponse(buildTwilioNoSpeechTwiml({ gatherActionUrl }));
  }

  let session =
    getVoiceCallSession(callSid) ??
    createVoiceCallSession({
      callSid,
      companyId,
      callerPhone: resolveCallerPhone(params),
    });

  appendVoiceCallTurn(callSid, {
    role: "caller",
    text: speechResult,
    at: new Date().toISOString(),
  });

  session = getVoiceCallSession(callSid)!;
  const promptContext = await resolveVoiceCallPromptContext(callSid, companyId);

  const priorTurns = session.turns.slice(0, -1);
  const reply = await generateHelpyPhoneReply({
    promptContext,
    priorTurns,
    callerMessage: speechResult,
  });

  appendVoiceCallTurn(callSid, {
    role: "helpy",
    text: reply,
    at: new Date().toISOString(),
  });

  session = getVoiceCallSession(callSid)!;

  const dbCall =
    (session.dbCallId
      ? await findVoiceCallByExternalId(callSid)
      : null) ?? null;

  const flatTranscript = flattenVoiceTranscript(session.turns);
  const callId =
    session.dbCallId ??
    dbCall?.id ??
    (
      await createVoiceCall(companyId, {
        externalCallId: callSid,
        callerPhone: session.callerPhone,
        status: "in_progress",
      })
    ).id;

  upsertVoiceCallSession(callSid, { dbCallId: callId });

  await updateVoiceCall(callId, {
    status: "in_progress",
    caller_phone: session.callerPhone,
    transcript: flatTranscript,
    transcript_turns: session.turns as unknown as Json,
    assistant_reply: reply,
  });

  if (shouldEndVoiceCall(session)) {
    return twimlResponse(buildTwilioGoodbyeTwiml(reply));
  }

  return twimlResponse(
    buildTwilioReplyAndGatherTwiml({
      reply,
      gatherActionUrl,
    })
  );
}

export async function handleTwilioCallStatus(
  companyId: string,
  params: Record<string, string>
): Promise<Response> {
  const callSid = resolveCallSid(params);
  if (!callSid) {
    return new Response("OK", { status: 200 });
  }

  const callStatus = (params.CallStatus ?? "").toLowerCase();
  const durationRaw = params.CallDuration ?? params.Duration;
  const durationSeconds =
    durationRaw && !Number.isNaN(Number(durationRaw))
      ? Number(durationRaw)
      : null;

  const session = deleteVoiceCallSession(callSid);
  const existing = await findVoiceCallByExternalId(callSid);

  if (!existing && !session) {
    return new Response("OK", { status: 200 });
  }

  const callId = existing?.id ?? session?.dbCallId;
  if (!callId) {
    return new Response("OK", { status: 200 });
  }

  if (callStatus === "completed" || callStatus === "busy" || callStatus === "failed" || callStatus === "no-answer") {
    const turns = session?.turns ?? [];
    const flatTranscript =
      turns.length > 0
        ? flattenVoiceTranscript(turns)
        : existing?.transcript ?? "";

    if (flatTranscript.length >= 8) {
      const promptContext = await resolveVoiceCallPromptContext(callSid, companyId);
      const analysis =
        (await analyzeVoiceCallTranscript({
          promptContext,
          transcript: flatTranscript,
        })) ?? null;

      const classification =
        analysis?.classification ?? detectVoiceCallClassification(flatTranscript);

      const summary = await generateHelpyCallSummary({
        systemContext: promptContext.systemContext,
        transcript: flatTranscript,
      });

      const callRecord = {
        ...(existing ?? {
          id: callId,
          companyId,
          externalCallId: callSid,
          callerPhone: session?.callerPhone ?? null,
          callerName: analysis?.callerName ?? null,
          status: "completed" as const,
          durationSeconds: null,
          transcript: null,
          summary: null,
          intent: null,
          vorgangId: null,
          startedAt: new Date().toISOString(),
          endedAt: null,
        }),
        transcript: flatTranscript,
        callerPhone: session?.callerPhone ?? existing?.callerPhone ?? null,
        callerName: analysis?.callerName ?? existing?.callerName ?? null,
      };

      const shouldProcess =
        shouldCreateVoiceVorgang(classification) &&
        (analysis?.createVorgang !== false || flatTranscript.length >= 8);

      if (shouldProcess) {
        const processed = processVoiceCall({
          call: callRecord,
          transcript: flatTranscript,
          classification,
          callerName: analysis?.callerName ?? null,
          objectReference: analysis?.objectReference ?? null,
          requestedDateTime: analysis?.requestedDateTime ?? null,
          summaryOverride: analysis?.summaryHint ?? summary,
        });

        await dispatchVoiceCallAlert({
          companyId,
          companyName: promptContext.companyName,
          callerPhone: callRecord.callerPhone,
          classification,
          summary: summary || processed.call.summary || "",
          transcript: flatTranscript,
        });

        await updateVoiceCall(callId, {
          status: callStatus === "completed" ? "completed" : "failed",
          duration_seconds: durationSeconds ?? existing?.durationSeconds,
          transcript: flatTranscript,
          transcript_turns: turns as unknown as Json,
          summary: summary || processed.call.summary,
          intent: processed.call.intent,
          vorgang_id: processed.vorgangId,
          caller_name: processed.callerName ?? null,
          assistant_reply: processed.assistantReply,
          processed_payload: processed as unknown as Json,
          ended_at: new Date().toISOString(),
        });
      } else {
        await updateVoiceCall(callId, {
          status: callStatus === "completed" ? "completed" : "failed",
          duration_seconds: durationSeconds ?? existing?.durationSeconds,
          transcript: flatTranscript,
          transcript_turns: turns as unknown as Json,
          summary,
          ended_at: new Date().toISOString(),
        });
      }

      clearVoiceCallPromptContext(callSid);
    } else {
      await updateVoiceCall(callId, {
        status: callStatus === "completed" ? "missed" : "failed",
        duration_seconds: durationSeconds ?? existing?.durationSeconds,
        transcript_turns: turns as unknown as Json,
        ended_at: new Date().toISOString(),
      });
      clearVoiceCallPromptContext(callSid);
    }

    return new Response("OK", { status: 200 });
  }

  if (callStatus === "in-progress" || callStatus === "ringing") {
    await updateVoiceCall(callId, {
      status: callStatus === "ringing" ? "ringing" : "in_progress",
      duration_seconds: durationSeconds ?? undefined,
    });
  }

  return new Response("OK", { status: 200 });
}
