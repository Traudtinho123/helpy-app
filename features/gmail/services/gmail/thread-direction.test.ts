/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import {
  analyzeGmailThread,
  resolveMessageDirection,
} from "@/features/gmail/services/gmail/thread-direction";
import type { GmailConnectorMessage } from "@/features/gmail/services/gmail/types";
import {
  applyThreadSnapshotToVorgang,
  isVorgangActiveOpen,
  isVorgangAwaitingCustomerReply,
} from "@/features/workspace/services/vorgaenge/vorgang-thread-status";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";

function buildMessage(
  overrides: Partial<GmailConnectorMessage> = {}
): GmailConnectorMessage {
  return {
    id: "msg-1",
    threadId: "thread-1",
    subject: "Anfrage",
    from: "Kunde <kunde@example.com>",
    snippet: "Hallo",
    date: "2026-07-01T10:00:00.000Z",
    ...overrides,
  };
}

function buildVorgang(overrides: Partial<Vorgang> = {}): Vorgang {
  return {
    id: "brain-v3-msg-1",
    typ: "anfrage",
    titel: "Anfrage",
    emoji: "🏠",
    kunde: "Kunde",
    quelle: "Gmail",
    prioritaet: "hoch",
    status: "neu",
    helpyEmpfehlung: "Antwort vorbereiten",
    receivedAt: "2026-07-01T10:00:00.000Z",
    receivedLabel: "01.07.2026",
    threadId: "thread-1",
    sourceEventId: "msg-1",
    ...overrides,
  };
}

describe("thread-direction", () => {
  it("erkennt outgoing über SENT-Label", () => {
    expect(
      resolveMessageDirection(
        {
          from: "Firma <firma@example.com>",
          labelIds: ["SENT"],
        },
        ["firma@example.com"]
      )
    ).toBe("outgoing");
  });

  it("erkennt incoming von externem Absender", () => {
    expect(
      resolveMessageDirection(
        {
          from: "Kunde <kunde@example.com>",
          labelIds: ["INBOX", "UNREAD"],
        },
        ["firma@example.com"]
      )
    ).toBe("incoming");
  });

  it("nutzt die neueste Thread-Nachricht für die Richtung", () => {
    const snapshot = analyzeGmailThread(
      [
        buildMessage({
          id: "msg-in",
          date: "2026-07-01T10:00:00.000Z",
          from: "Kunde <kunde@example.com>",
        }),
        buildMessage({
          id: "msg-out",
          date: "2026-07-02T11:00:00.000Z",
          from: "Firma <firma@example.com>",
          labelIds: ["SENT"],
        }),
      ],
      ["firma@example.com"]
    );

    expect(snapshot?.latestMessageDirection).toBe("outgoing");
    expect(snapshot?.hasUnreadExternalMessage).toBe(false);
  });
});

describe("vorgang-thread-status", () => {
  it("markiert Vorgang nach Unternehmensantwort als Warten auf Antwort", () => {
    const vorgang = buildVorgang();
    const updated = applyThreadSnapshotToVorgang(vorgang, {
      threadId: "thread-1",
      latestMessageId: "msg-out",
      latestMessageAt: "2026-07-02T11:00:00.000Z",
      latestMessageFrom: "Firma <firma@example.com>",
      latestMessageDirection: "outgoing",
      hasUnreadExternalMessage: false,
    });

    expect(updated.status).toBe("wartend");
    expect(updated.prioritaet).toBe("niedrig");
    expect(isVorgangAwaitingCustomerReply(updated)).toBe(true);
    expect(isVorgangActiveOpen(updated)).toBe(false);
  });

  it("reaktiviert Vorgang bei neuer Kundenantwort", () => {
    const waiting = buildVorgang({
      status: "wartend",
      latestMessageDirection: "outgoing",
      prioritaet: "niedrig",
    });

    const updated = applyThreadSnapshotToVorgang(
      waiting,
      {
        threadId: "thread-1",
        latestMessageId: "msg-in-2",
        latestMessageAt: "2026-07-08T09:00:00.000Z",
        latestMessageFrom: "Kunde <kunde@example.com>",
        latestMessageDirection: "incoming",
        hasUnreadExternalMessage: true,
      },
      waiting
    );

    expect(updated.status).toBe("neu");
    expect(isVorgangActiveOpen(updated)).toBe(true);
    expect(updated.helpyMessage).toContain("erneut geantwortet");
  });
});
