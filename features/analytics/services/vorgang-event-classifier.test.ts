import { describe, expect, it } from "vitest";
import {
  classifyVorgangForAnalytics,
  isAppointmentRequestVorgang,
  isNewInquiryVorgang,
} from "@/features/analytics/services/vorgang-event-classifier";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

function buildVorgang(overrides: Partial<Vorgang> = {}): Vorgang {
  return {
    id: "brain-v3-msg-001",
    typ: "anfrage",
    titel: "Besichtigung Wohnung",
    emoji: "🏠",
    kunde: "Max Mustermann",
    quelle: "Gmail",
    mailProvider: "gmail",
    prioritaet: "mittel",
    status: "neu",
    helpyEmpfehlung: "Antwort vorbereiten",
    receivedAt: "2026-07-07T10:00:00.000Z",
    receivedLabel: "07.07.2026",
    threadId: "thread-abc",
    emailDate: "2026-07-07T10:00:00.000Z",
    ...overrides,
  };
}

describe("vorgang-event-classifier", () => {
  it("erkennt Besichtigungsanfragen", () => {
    const vorgang = buildVorgang({
      typ: "terminwunsch",
      intentLabel: "Besichtigung anfragen",
    });
    expect(isAppointmentRequestVorgang(vorgang)).toBe(true);
  });

  it("erkennt neue Interessenten", () => {
    expect(isNewInquiryVorgang(buildVorgang({ typ: "anfrage" }))).toBe(true);
  });

  it("mappt einen Vorgang auf ein Analytics-Event", () => {
    const event = classifyVorgangForAnalytics(buildVorgang());
    expect(event).toMatchObject({
      provider: "gmail",
      providerThreadId: "thread-abc",
      isNewInquiry: true,
    });
    expect(event?.receivedAt).toBe("2026-07-07T10:00:00.000Z");
  });

  it("ignoriert Vorgänge ohne Mail-Provider und Zeitstempel", () => {
    expect(
      classifyVorgangForAnalytics(
        buildVorgang({
          mailProvider: undefined,
          quelle: "Telefon",
          emailDate: undefined,
          receivedAt: "",
        })
      )
    ).toBeNull();
  });
});
