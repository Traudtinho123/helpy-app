import { describe, expect, it } from "vitest";
import { runMockConversationServer } from "@/features/voice/voice-core/voice-core.server";
import type { VoiceCallRecord } from "@/features/voice/types/voice-types";

function mockCall(): VoiceCallRecord {
  return {
    id: "call-test-1",
    companyId: "test",
    externalCallId: null,
    callerPhone: "+41 79 111 22 33",
    callerName: "Test Anrufer",
    status: "in_progress",
    durationSeconds: null,
    transcript: null,
    summary: null,
    intent: null,
    vorgangId: null,
    startedAt: new Date().toISOString(),
    endedAt: null,
  };
}

describe("Voice Core v1", () => {
  it("verarbeitet Mock-Gespräch ohne Provider-Abhängigkeit", () => {
    const { processed, conversation, end } = runMockConversationServer({
      transcript: "Ich möchte morgen eine Besichtigung vereinbaren.",
      call: mockCall(),
      providerId: "mock",
      callerName: "Anna",
    });

    expect(processed.vorgangId).toMatch(/^voice-/);
    expect(processed.assistantReply.length).toBeGreaterThan(10);
    expect(conversation.providerId).toBe("mock");
    expect(conversation.status).toBe("completed");
    expect(end.memoryId).toMatch(/^vm-/);
  });

  it("erkennt Rückruf-Intent", () => {
    const { processed } = runMockConversationServer({
      transcript: "Bitte rufen Sie mich zurück wegen der Offerte.",
      call: mockCall(),
      providerId: "mock",
    });

    expect(processed.call.intent).toBe("rueckruf");
    expect(processed.liste.quelle).toBe("Telefon");
  });
});
