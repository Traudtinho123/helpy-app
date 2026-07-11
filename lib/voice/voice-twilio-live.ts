import { processVoiceCall } from "@/features/voice/services/voice-call-processor";
import {
  buildTwilioClosedTwiml,
  buildTwilioDisabledTwiml,
  buildTwilioEmptySpeechTwiml,
  buildTwilioFarewellTwiml,
  buildTwilioGoodbyeTwiml,
  buildTwilioIncomingTwiml,
  buildTwilioMaxEmptyResultsTwiml,
  buildTwilioRateLimitTwiml,
  buildTwilioReplyAndGatherTwiml,
  VOICE_EMPTY_RESULT_MESSAGES,
  VOICE_FAREWELL_MESSAGE,
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
  incrementEmptyResultCount,
  resetEmptyResultCount,
  shouldEndVoiceCall,
  upsertVoiceCallSession,
  type VoiceCallSession,
} from "@/lib/voice/voice-call-session-store";
import {
  ensureVoiceCallSessionWithDbTurns,
  persistVoiceCallSessionState,
  persistVoiceCallTranscript,
  pickLatestTranscriptTurns,
} from "@/lib/voice/voice-call-transcript";
import { isCallerFarewell } from "@/lib/voice/voice-farewell-detector";
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

async function resolveCallIdForSession(input: {
  companyId: string;
  callSid: string;
  session: VoiceCallSession;
}): Promise<string> {
  if (input.session.dbCallId) return input.session.dbCallId;

  const created = await createVoiceCall(input.companyId, {
    externalCallId: input.callSid,
    callerPhone: input.session.callerPhone,
    status: "in_progress",
  });

  upsertVoiceCallSession(input.callSid, { dbCallId: created.id });
  return created.id;
}

async function finalizeCallWithCallbackVorgang(input: {
  companyId: string;
  callSid: string;
  callId: string;
  goodbyeText: string;
}): Promise<Response> {
  const existing = await findVoiceCallByExternalId(input.callSid);
  const session = getVoiceCallSession(input.callSid);

  appendVoiceCallTurn(input.callSid, {
    role: "helpy",
    text: input.goodbyeText,
    at: new Date().toISOString(),
  });

  const activeSession = getVoiceCallSession(input.callSid);
  const turns = pickLatestTranscriptTurns(
    activeSession?.turns,
    existing?.transcriptTurns
  );
  const flatTranscript = flattenVoiceTranscript(turns);
  const promptContext = await resolveVoiceCallPromptContext(input.callSid, input.companyId);

  const summary =
    (await generateHelpyCallSummary({
      systemContext: promptContext.systemContext,
      transcript: flatTranscript,
    })) ||
    "Anrufer konnte nicht verstanden werden — Rückruf erbeten.";

  const callRecord = {
    ...(existing ?? {
      id: input.callId,
      companyId: input.companyId,
      externalCallId: input.callSid,
      callerPhone: session?.callerPhone ?? null,
      callerName: null,
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
  };

  const processed = processVoiceCall({
    call: callRecord,
    transcript: flatTranscript,
    classification: "rueckruf_wunsch",
    summaryOverride: summary,
  });

  if (activeSession) {
    await persistVoiceCallSessionState(input.callId, activeSession, {
      status: "completed",
      callerPhone: activeSession.callerPhone,
      assistantReply: input.goodbyeText,
    });
  } else {
    await persistVoiceCallTranscript(input.callId, turns, {
      status: "completed",
      assistantReply: input.goodbyeText,
    });
    await updateVoiceCall(input.callId, { empty_result_count: 3 });
  }

  await dispatchVoiceCallAlert({
    companyId: input.companyId,
    companyName: promptContext.companyName,
    callerPhone: callRecord.callerPhone,
    classification: "rueckruf_wunsch",
    summary,
    transcript: flatTranscript,
  });

  await updateVoiceCall(input.callId, {
    status: "completed",
    transcript: flatTranscript,
    transcript_turns: turns as unknown as Json,
    summary: processed.call.summary ?? summary,
    intent: processed.call.intent,
    vorgang_id: processed.vorgangId,
    assistant_reply: input.goodbyeText,
    processed_payload: processed as unknown as Json,
    empty_result_count: 3,
    ended_at: new Date().toISOString(),
  });

  deleteVoiceCallSession(input.callSid);
  clearVoiceCallPromptContext(input.callSid);

  return twimlResponse(buildTwilioMaxEmptyResultsTwiml());
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
    await persistVoiceCallTranscript(dbCallId, session?.turns ?? [], {
      status: "in_progress",
      callerPhone,
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

  let { session, callId } = await ensureVoiceCallSessionWithDbTurns({
    callSid,
    companyId,
    callerPhone: resolveCallerPhone(params),
  });

  if (!callId) {
    callId = await resolveCallIdForSession({ companyId, callSid, session });
    session = getVoiceCallSession(callSid)!;
  }

  const speechResult = params.SpeechResult?.trim() ?? "";

  if (speechResult.length < 2) {
    const attempt = incrementEmptyResultCount(callSid);
    session = getVoiceCallSession(callSid)!;
    await updateVoiceCall(callId, { empty_result_count: attempt });

    if (attempt >= 3) {
      return finalizeCallWithCallbackVorgang({
        companyId,
        callSid,
        callId,
        goodbyeText: VOICE_EMPTY_RESULT_MESSAGES.final,
      });
    }

    return twimlResponse(
      buildTwilioEmptySpeechTwiml({
        gatherActionUrl,
        attempt: attempt === 1 ? 1 : 2,
      })
    );
  }

  resetEmptyResultCount(callSid);
  await updateVoiceCall(callId, { empty_result_count: 0 });
  session = getVoiceCallSession(callSid)!;

  if (isCallerFarewell(speechResult)) {
    appendVoiceCallTurn(callSid, {
      role: "caller",
      text: speechResult,
      at: new Date().toISOString(),
    });

    appendVoiceCallTurn(callSid, {
      role: "helpy",
      text: VOICE_FAREWELL_MESSAGE,
      at: new Date().toISOString(),
    });

    session = getVoiceCallSession(callSid)!;
    await persistVoiceCallSessionState(callId, session, {
      status: "in_progress",
      callerPhone: session.callerPhone,
      assistantReply: VOICE_FAREWELL_MESSAGE,
    });

    return twimlResponse(buildTwilioFarewellTwiml());
  }

  appendVoiceCallTurn(callSid, {
    role: "caller",
    text: speechResult,
    at: new Date().toISOString(),
  });

  session = getVoiceCallSession(callSid)!;

  await persistVoiceCallSessionState(callId, session, {
    status: "in_progress",
    callerPhone: session.callerPhone,
  });

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

  await persistVoiceCallSessionState(callId, session, {
    status: "in_progress",
    callerPhone: session.callerPhone,
    assistantReply: reply,
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

  const turns = pickLatestTranscriptTurns(session?.turns, existing?.transcriptTurns);
  const flatTranscript =
    turns.length > 0
      ? flattenVoiceTranscript(turns)
      : existing?.transcript ?? "";

  if (callStatus === "completed" || callStatus === "busy" || callStatus === "failed" || callStatus === "no-answer") {
    if (existing?.hasPreparedVorgang) {
      await updateVoiceCall(callId, {
        status: callStatus === "completed" ? "completed" : "failed",
        duration_seconds: durationSeconds ?? existing.durationSeconds,
        ended_at: existing.endedAt ?? new Date().toISOString(),
      });
      clearVoiceCallPromptContext(callSid);
      return new Response("OK", { status: 200 });
    }

    await persistVoiceCallTranscript(callId, turns, {
      status:
        callStatus === "completed"
          ? flatTranscript.length >= 8
            ? "completed"
            : "missed"
          : "failed",
      callerPhone: session?.callerPhone ?? existing?.callerPhone ?? null,
    });

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
