import { describe, expect, it } from "vitest";
import { processVoiceCall } from "@/features/voice/services/voice-call-processor";
import type { VoiceCallRecord } from "@/features/voice/types/voice-types";

describe("processVoiceCall", () => {
  it("erzeugt Telefon-Vorgang mit quelle Telefon", () => {
    const call: VoiceCallRecord = {
      id: "call-test-1",
      companyId: "company-1",
      externalCallId: null,
      callerPhone: "+41 79 111 22 33",
      callerName: "Max Meier",
      status: "in_progress",
      durationSeconds: null,
      transcript: null,
      summary: null,
      intent: null,
      vorgangId: null,
      startedAt: "2026-07-09T10:00:00.000Z",
      endedAt: null,
    };

    const result = processVoiceCall({
      call,
      transcript:
        "Guten Tag, ich interessiere mich für die Wohnung und möchte besichtigen.",
    });

    expect(result.liste.quelle).toBe("Telefon");
    expect(result.liste.emoji).toBe("☎");
    expect(result.liste.kunde).toBe("Max Meier");
    expect(result.vorgangId).toBe("voice-call-test-1");
    expect(result.workspace.kopfzeile?.quelle).toBe("Telefon");
  });
});
