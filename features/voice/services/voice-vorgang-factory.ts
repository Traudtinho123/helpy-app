import { findCrmCustomerByMatch } from "@/features/crm/services/crm-store";
import { normalizePhone } from "@/features/crm/services/crm-merge";
import { getAllKundenakten } from "@/features/kundenakte/services/kundenakte-store";
import type { Kundenakte } from "@/features/kundenakte/types/kundenakte-types";
import {
  buildHelpyPhoneVorgangContent,
  buildHelpyPhoneVorgangTitle,
  HELPY_PHONE_QUELLE,
  mapVoiceClassificationToHelpyPhoneTyp,
  mapVoiceClassificationToPriority,
} from "@/features/voice/services/helpy-phone-detector";
import {
  buildVoiceAppointmentProposal,
  enrichVoiceProcessedCallWithAppointmentProposal,
} from "@/features/voice/services/voice-appointment-proposal";
import { processVoiceCall } from "@/features/voice/services/voice-call-processor";
import { ingestVoiceProcessedCall } from "@/features/voice/services/voice-vorgaenge-store";
import type {
  VoiceCallClassification,
  VoiceCallRecord,
  VoiceProcessedCall,
} from "@/features/voice/types/voice-types";
import { VOICE_CALL_CLASSIFICATION_LABELS } from "@/features/voice/types/voice-types";
import type { VoiceCallAnalysis } from "@/lib/voice/openai-voice-assistant";
import { flattenVoiceTranscript } from "@/lib/voice/voice-call-session-store";
import type { VoiceTranscriptTurn } from "@/lib/voice/voice-call-session-store";
import { updateVoiceCall } from "@/lib/voice/voice-call-repository";

export function findCustomerByCallerPhone(
  callerPhone?: string | null
): { kundenAkteId: string | null; customerName: string | null } {
  const phone = callerPhone?.trim();
  if (!phone) return { kundenAkteId: null, customerName: null };

  const normalized = normalizePhone(phone);
  if (normalized.length < 6) {
    return { kundenAkteId: null, customerName: null };
  }

  const kundenakte = getAllKundenakten().find(
    (record) => normalizePhone(record.telefon) === normalized
  );
  if (kundenakte) {
    return { kundenAkteId: kundenakte.id, customerName: kundenakte.name };
  }

  const crmMatch = findCrmCustomerByMatch({ telefon: phone });
  if (crmMatch) {
    return {
      kundenAkteId: crmMatch.id,
      customerName: crmMatch.ansprechpartner || crmMatch.firma,
    };
  }

  return { kundenAkteId: null, customerName: null };
}

export function resolveVoiceCallTranscript(input: {
  transcript?: string | null;
  transcriptTurns?: VoiceTranscriptTurn[];
}): string {
  if (input.transcriptTurns && input.transcriptTurns.length > 0) {
    return flattenVoiceTranscript(input.transcriptTurns);
  }
  return input.transcript?.trim() ?? "";
}

export function buildVoiceProcessedCallFromRecord(input: {
  call: VoiceCallRecord;
  transcript: string;
  classification?: VoiceCallClassification | null;
  callerName?: string | null;
  objectReference?: string | null;
  requestedDateTime?: string | null;
  summaryOverride?: string | null;
  analysis?: VoiceCallAnalysis | null;
  autoCreated?: boolean;
}): VoiceProcessedCall {
  const classification =
    input.classification ??
    input.analysis?.classification ??
    "sonstiges";

  const summary =
    input.summaryOverride?.trim() ||
    input.call.summary?.trim() ||
    input.transcript.slice(0, 280);

  const customerLink = findCustomerByCallerPhone(input.call.callerPhone);

  let processed = processVoiceCall({
    call: input.call,
    transcript: input.transcript,
    classification,
    callerName: input.callerName ?? input.call.callerName,
    objectReference: input.objectReference ?? null,
    requestedDateTime: input.requestedDateTime ?? null,
    summaryOverride: summary,
    analysis: input.analysis ?? null,
  });

  const appointmentDetails: string[] = [];
  if (input.requestedDateTime) {
    appointmentDetails.push(`Terminwunsch: ${input.requestedDateTime}`);
  }
  if (input.objectReference) {
    appointmentDetails.push(`Objekt: ${input.objectReference}`);
  }

  const titel = buildHelpyPhoneVorgangTitle({
    classification,
    summary,
    autoCreated: input.autoCreated,
  });

  const content = buildHelpyPhoneVorgangContent({
    summary,
    transcript: input.transcript,
    callId: input.call.id,
    callerPhone: input.call.callerPhone,
    appointmentDetails,
  });

  processed = {
    ...processed,
    liste: {
      ...processed.liste,
      typ: mapVoiceClassificationToHelpyPhoneTyp(classification),
      titel,
      emoji: classification === "notfall" ? "🚨" : "📞",
      quelle: HELPY_PHONE_QUELLE,
      prioritaet: mapVoiceClassificationToPriority(classification),
      status: "neu",
      helpyStatus: "Neu",
      summary: content,
      intentLabel: VOICE_CALL_CLASSIFICATION_LABELS[classification],
      kundenAkteId: customerLink.kundenAkteId ?? undefined,
      kunde: customerLink.customerName ?? processed.liste.kunde,
    },
    workspace: {
      ...processed.workspace,
      ...(processed.workspace.kopfzeile
        ? {
            kopfzeile: {
              ...processed.workspace.kopfzeile,
              quelle: HELPY_PHONE_QUELLE,
            },
          }
        : {}),
      kunde: {
        ...processed.workspace.kunde,
        firmenname:
          customerLink.customerName ?? processed.workspace.kunde.firmenname,
      },
      letzteEmail: {
        ...processed.workspace.letzteEmail,
        inhalt: content,
      },
    },
  };

  const proposal = buildVoiceAppointmentProposal({
    vorgangId: processed.vorgangId,
    classification,
    analysis: input.analysis ?? null,
    callerPhone: input.call.callerPhone,
    transcript: input.transcript,
    summary,
  });

  if (proposal) {
    processed = enrichVoiceProcessedCallWithAppointmentProposal(processed, proposal);
  }

  return processed;
}

export async function createVoiceVorgangFromCallRecord(input: {
  call: VoiceCallRecord;
  transcript: string;
  classification?: VoiceCallClassification | null;
  callerName?: string | null;
  objectReference?: string | null;
  requestedDateTime?: string | null;
  summaryOverride?: string | null;
  analysis?: VoiceCallAnalysis | null;
  autoCreated?: boolean;
  persistToDb?: boolean;
}): Promise<VoiceProcessedCall> {
  const processed = buildVoiceProcessedCallFromRecord(input);

  if (input.persistToDb !== false) {
    await updateVoiceCall(input.call.id, {
      vorgang_id: processed.vorgangId,
      summary: input.summaryOverride ?? input.call.summary ?? processed.liste.summary,
      intent: processed.call.intent,
      processed_payload: processed as unknown as import("@/lib/database/types").Json,
    });
  }

  if (typeof window !== "undefined") {
    return ingestVoiceProcessedCall(processed);
  }

  return processed;
}

export function createVoiceVorgangFromCallClient(input: {
  call: VoiceCallRecord;
  transcriptTurns?: VoiceTranscriptTurn[];
  classification?: VoiceCallClassification | null;
  summary?: string | null;
  autoCreated?: boolean;
}): VoiceProcessedCall {
  const transcript = resolveVoiceCallTranscript({
    transcript: input.call.transcript,
    transcriptTurns: input.transcriptTurns,
  });

  const processed = buildVoiceProcessedCallFromRecord({
    call: input.call,
    transcript,
    classification: input.classification ?? input.call.classification ?? "sonstiges",
    callerName: input.call.callerName,
    objectReference: null,
    requestedDateTime: input.call.requestedDateTime ?? null,
    summaryOverride: input.summary ?? input.call.summary,
    autoCreated: input.autoCreated,
  });

  return ingestVoiceProcessedCall(processed);
}

export function findKundenakteByPhone(phone?: string | null): Kundenakte | null {
  const normalized = normalizePhone(phone ?? "");
  if (normalized.length < 6) return null;

  return (
    getAllKundenakten().find(
      (record) => normalizePhone(record.telefon) === normalized
    ) ?? null
  );
}
