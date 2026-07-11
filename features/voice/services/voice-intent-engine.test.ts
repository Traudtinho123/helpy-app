import { describe, expect, it } from "vitest";
import {
  buildAssistantReply,
  detectVoiceIntent,
  mapVoiceIntentToVorgangTyp,
} from "@/features/voice/services/voice-intent-engine";

describe("detectVoiceIntent", () => {
  it("erkennt Besichtigungsanfragen", () => {
    const result = detectVoiceIntent(
      "Ich interessiere mich für die Wohnung und möchte gerne besichtigen."
    );
    expect(result.intent).toBe("besichtigung");
    expect(mapVoiceIntentToVorgangTyp(result.intent)).toBe("anfrage");
  });

  it("erkennt Rückrufwünsche", () => {
    const result = detectVoiceIntent("Bitte rufen Sie mich zurück.");
    expect(result.intent).toBe("rueckruf");
    expect(buildAssistantReply(result.intent, "Anna")).toContain("Anna");
  });

  it("erkennt Terminwünsche", () => {
    const result = detectVoiceIntent(
      "Können wir morgen um 14 Uhr einen Termin vereinbaren?"
    );
    expect(result.intent).toBe("terminwunsch");
  });
});
