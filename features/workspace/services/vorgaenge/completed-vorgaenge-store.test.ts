/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from "vitest";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import {
  applyCompletedDisplayState,
  clearCompletedVorgangIfReopened,
  findCompletedRecord,
  getCompletedVorgangRecords,
  isVorgangCompleted,
  registerCompletedVorgang,
  resetCompletedVorgaengeStoreForTests,
  simulateCompletedVorgaengeStoreReloadForTests,
  shouldSuppressReopenedVorgang,
  VORGANG_REOPENED_HELpy_MESSAGE,
} from "@/features/workspace/services/vorgaenge/completed-vorgaenge-store";
import { getEffectiveVorgangStatus } from "@/features/workspace/services/vorgaenge/vorgang-effective-status";
import {
  isVorgangActiveOpen,
  isVorgangAwaitingCustomerReply,
} from "@/features/workspace/services/vorgaenge/vorgang-thread-status";

function buildTestVorgang(overrides: Partial<Vorgang> = {}): Vorgang {
  return {
    id: "brain-v3-msg-001",
    typ: "anfrage",
    titel: "Anfrage Wohnung",
    emoji: "🏠",
    kunde: "Max Mustermann",
    quelle: "Gmail",
    mailProvider: "gmail",
    prioritaet: "mittel",
    status: "neu",
    helpyEmpfehlung: "Antwort vorbereiten",
    receivedAt: "2026-07-01T10:00:00.000Z",
    receivedLabel: "01.07.2026",
    sourceEventId: "msg-001",
    threadId: "thread-abc",
    emailDate: "2026-07-01T10:00:00.000Z",
    latestMessageDirection: "incoming",
    latestMessageAt: "2026-07-01T10:00:00.000Z",
    ...overrides,
  };
}

afterEach(() => {
  resetCompletedVorgaengeStoreForTests();
});

describe("completed-vorgaenge-store", () => {
  it("speichert Erledigt persistent in localStorage und überlebt Re-Hydration", () => {
    const vorgang = buildTestVorgang();

    registerCompletedVorgang(vorgang, "user-1");
    expect(isVorgangCompleted(vorgang)).toBe(true);
    expect(shouldSuppressReopenedVorgang(vorgang)).toBe(true);

    const stored = window.localStorage.getItem("helpy-completed-vorgaenge-v1");
    expect(stored).toBeTruthy();

    simulateCompletedVorgaengeStoreReloadForTests();

    const reloaded = buildTestVorgang();
    expect(isVorgangCompleted(reloaded)).toBe(true);
    expect(shouldSuppressReopenedVorgang(reloaded)).toBe(true);
  });

  it("migriert legacy sessionStorage-Einträge nach localStorage", () => {
    window.sessionStorage.setItem(
      "helpy-completed-vorgaenge",
      JSON.stringify([
        {
          vorgangId: "brain-v3-msg-002",
          caseId: "gmail:thread:thread-xyz",
          gmailThreadId: "thread-xyz",
          gmailMessageIds: ["msg-002"],
          latestMessageAt: "2026-07-02T08:00:00.000Z",
          completedAt: "2026-07-02T09:00:00.000Z",
          status: "Erledigt",
        },
      ])
    );

    const vorgang = buildTestVorgang({
      id: "brain-v3-msg-002",
      sourceEventId: "msg-002",
      threadId: "thread-xyz",
      emailDate: "2026-07-02T08:00:00.000Z",
    });

    expect(isVorgangCompleted(vorgang)).toBe(true);
    expect(window.localStorage.getItem("helpy-completed-vorgaenge-v1")).toBeTruthy();
    expect(window.sessionStorage.getItem("helpy-completed-vorgaenge")).toBeNull();
  });

  it("findet Erledigt-Einträge primär über providerThreadId", () => {
    registerCompletedVorgang(
      buildTestVorgang({
        id: "brain-v3-old-id",
        threadId: "thread-stable",
      }),
      "user-1"
    );

    const withNewUiId = buildTestVorgang({
      id: "brain-v3-new-ui-id",
      threadId: "thread-stable",
      emailDate: "2026-07-01T10:00:00.000Z",
    });

    expect(findCompletedRecord(withNewUiId)?.providerThreadId).toBe("thread-stable");
    expect(shouldSuppressReopenedVorgang(withNewUiId)).toBe(true);
  });

  it("reaktiviert Vorgang bei neuerer eingehender Kundenmail und setzt HELPY-Hinweis", () => {
    const original = buildTestVorgang({
      emailDate: "2026-07-01T10:00:00.000Z",
      receivedAt: "2026-07-01T10:00:00.000Z",
      latestMessageDirection: "incoming",
      latestMessageAt: "2026-07-01T10:00:00.000Z",
    });
    registerCompletedVorgang(original, "user-1");

    const newerMessage = buildTestVorgang({
      id: "brain-v3-msg-001-reply",
      emailDate: "2026-07-08T14:00:00.000Z",
      receivedAt: "2026-07-08T14:00:00.000Z",
      latestMessageDirection: "incoming",
      latestMessageAt: "2026-07-08T14:00:00.000Z",
    });

    expect(shouldSuppressReopenedVorgang(newerMessage)).toBe(false);

    clearCompletedVorgangIfReopened(newerMessage);

    expect(isVorgangCompleted(newerMessage)).toBe(false);
    expect(getCompletedVorgangRecords()).toHaveLength(0);
  });

  it("reaktiviert nicht bei gleicher oder älterer Nachricht", () => {
    const vorgang = buildTestVorgang({
      emailDate: "2026-07-08T14:00:00.000Z",
      latestMessageAt: "2026-07-08T14:00:00.000Z",
      latestMessageDirection: "incoming",
    });
    registerCompletedVorgang(vorgang, "user-1");

    clearCompletedVorgangIfReopened(
      buildTestVorgang({
        emailDate: "2026-07-08T14:00:00.000Z",
        latestMessageAt: "2026-07-08T14:00:00.000Z",
        latestMessageDirection: "incoming",
      })
    );
    expect(isVorgangCompleted(vorgang)).toBe(true);

    clearCompletedVorgangIfReopened(
      buildTestVorgang({
        emailDate: "2026-07-01T10:00:00.000Z",
        latestMessageAt: "2026-07-01T10:00:00.000Z",
        latestMessageDirection: "incoming",
      })
    );
    expect(isVorgangCompleted(vorgang)).toBe(true);
  });

  it("öffnet erledigten Vorgang NICHT bei Unternehmensantwort (Handy/Gmail)", () => {
    const original = buildTestVorgang({
      latestMessageDirection: "incoming",
      latestMessageAt: "2026-07-01T10:00:00.000Z",
    });
    registerCompletedVorgang(original, "user-1");

    const companyReply = buildTestVorgang({
      id: "brain-v3-msg-company",
      sourceEventId: "msg-company",
      latestMessageDirection: "outgoing",
      latestMessageAt: "2026-07-09T12:00:00.000Z",
      emailDate: "2026-07-09T12:00:00.000Z",
      status: "wartend",
    });

    expect(shouldSuppressReopenedVorgang(companyReply)).toBe(true);
    clearCompletedVorgangIfReopened(companyReply);
    expect(isVorgangCompleted(companyReply)).toBe(true);
    expect(isVorgangActiveOpen(companyReply)).toBe(false);
    expect(isVorgangAwaitingCustomerReply(companyReply)).toBe(true);
    expect(getEffectiveVorgangStatus(companyReply)).toBe("wartend");
  });

  it("bleibt erledigt nach Reload-Sync mit gleichem Thread-Snapshot", () => {
    const original = buildTestVorgang({
      emailDate: "2026-07-01T10:00:00.000Z",
      latestMessageAt: "2026-07-01T10:00:00.000Z",
      latestMessageDirection: "incoming",
    });
    registerCompletedVorgang(original, "user-1");

    simulateCompletedVorgaengeStoreReloadForTests();

    const afterReload = buildTestVorgang({
      emailDate: "2026-07-01T10:00:00.000Z",
      latestMessageAt: "2026-07-01T10:00:00.000Z",
      latestMessageDirection: "incoming",
    });

    expect(shouldSuppressReopenedVorgang(afterReload)).toBe(true);
    expect(getCompletedVorgangRecords()).toHaveLength(1);
  });

  it("bleibt erledigt nach Unternehmensantwort (lastKnownIncoming bleibt erhalten)", () => {
    const original = buildTestVorgang({
      emailDate: "2026-07-01T10:00:00.000Z",
      latestMessageAt: "2026-07-01T10:00:00.000Z",
      latestMessageDirection: "incoming",
    });
    registerCompletedVorgang(original, "user-1");

    const companyReply = buildTestVorgang({
      latestMessageDirection: "outgoing",
      latestMessageAt: "2026-07-09T12:00:00.000Z",
      emailDate: "2026-07-09T12:00:00.000Z",
    });

    expect(shouldSuppressReopenedVorgang(companyReply)).toBe(true);
    expect(getCompletedVorgangRecords()).toHaveLength(1);
  });

  it("applyCompletedDisplayState mutiert den Store nicht", () => {
    const vorgang = buildTestVorgang();
    registerCompletedVorgang(vorgang, "user-1");

    const displayed = applyCompletedDisplayState(
      buildTestVorgang({
        status: "neu",
        latestMessageAt: "2026-07-01T10:00:00.000Z",
      })
    );

    expect(displayed.status).toBe("erledigt");
    expect(getCompletedVorgangRecords()).toHaveLength(1);
  });

  it("speichert provider-unabhängige Felder (gmail | outlook)", () => {
    registerCompletedVorgang(
      buildTestVorgang({
        id: "brain-v3-outlook-msg-9",
        quelle: "Outlook",
        mailProvider: "outlook",
        threadId: "conversation-9",
        sourceEventId: "msg-9",
      }),
      "user-1"
    );

    const record = findCompletedRecord(
      buildTestVorgang({
        id: "brain-v3-outlook-msg-9",
        quelle: "Outlook",
        mailProvider: "outlook",
        threadId: "conversation-9",
        sourceEventId: "msg-9",
      })
    );

    expect(record?.provider).toBe("outlook");
    expect(record?.providerThreadId).toBe("conversation-9");
    expect(record?.status).toBe("Erledigt");
    expect(record?.lastKnownIncomingMessageAt).toBeTruthy();
  });
});

describe("completed-vorgaenge-store HELPY reopen message", () => {
  it("exportiert den deutschen Reopen-Hinweis", () => {
    expect(VORGANG_REOPENED_HELpy_MESSAGE).toBe(
      "Der Kunde hat erneut geantwortet. Ich habe den Vorgang wieder geöffnet."
    );
  });
});
