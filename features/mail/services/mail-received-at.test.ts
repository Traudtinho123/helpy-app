/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest";
import {
  normalizeMailTimestampToIso,
  resolveVorgangInquiryReceivedAt,
} from "@/features/mail/services/mail-received-at";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

function buildMailVorgang(overrides: Partial<Vorgang> = {}): Vorgang {
  return {
    id: "vorgang-mail-test",
    typ: "anfrage",
    titel: "Test",
    emoji: "📩",
    kunde: "Anna",
    quelle: "Gmail",
    prioritaet: "mittel",
    status: "neu",
    helpyEmpfehlung: "Antworten",
    receivedAt: "2026-07-11T12:00:00.000Z",
    receivedLabel: "Heute",
    emailDate: "Sat, 11 Jul 2026 08:00:00 +0000",
    latestMessageDirection: "incoming",
    latestMessageAt: "2026-07-11T08:00:00.000Z",
    ...overrides,
  };
}

describe("mail received at", () => {
  it("normalisiert Gmail-Date-Header zu ISO", () => {
    expect(
      normalizeMailTimestampToIso("Sat, 11 Jul 2026 08:00:00 +0000")
    ).toBe("2026-07-11T08:00:00.000Z");
  });

  it("bevorzugt Gmail-Eingangszeit vor HELPY-Sync-Zeit", () => {
    const vorgang = buildMailVorgang({
      receivedAt: "2026-07-11T12:00:00.000Z",
      latestMessageAt: "2026-07-11T08:00:00.000Z",
    });

    expect(resolveVorgangInquiryReceivedAt(vorgang)).toBe(
      "2026-07-11T08:00:00.000Z"
    );
  });

  it("blendet Timer aus wenn zuletzt ausgehend geantwortet wurde", () => {
    const vorgang = buildMailVorgang({
      latestMessageDirection: "outgoing",
      latestMessageAt: "2026-07-11T10:00:00.000Z",
    });

    expect(resolveVorgangInquiryReceivedAt(vorgang)).toBeNull();
  });
});
