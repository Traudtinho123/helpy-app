import { GMAIL_WAITING_FOR_REPLY_STATUS } from "@/features/gmail/services/gmail-drafts";
import { formatGmailDateTime } from "@/features/gmail/services/gmail-date-format";
import type { GmailThreadSnapshot } from "@/features/gmail/services/gmail/thread-direction";
import { normalizeMailTimestampToIso } from "@/features/mail/services/mail-received-at";
import {
  VORGANG_ALREADY_REPLIED_HELpy_MESSAGE,
  VORGANG_CUSTOMER_REPLIED_HELpy_MESSAGE,
} from "@/features/gmail/services/gmail/thread-direction";
import { recordGmailReplySent } from "@/features/workspace/services/status/status-engine";
import { startFollowUpFromGmailSend } from "@/features/followup/services/followup-engine";
import {
  shouldSuppressReopenedVorgang,
  isVorgangCompleted,
  clearCompletedVorgangIfReopened,
} from "@/features/workspace/services/vorgaenge/completed-vorgaenge-store";
import type {
  Vorgang,
  VorgangPriority,
  VorgangStatus,
} from "@/features/workspace/services/vorgaenge/types";

export {
  VORGANG_ALREADY_REPLIED_HELpy_MESSAGE,
  VORGANG_CUSTOMER_REPLIED_HELpy_MESSAGE,
};

function wasAwaitingCustomerReply(vorgang?: Vorgang | null): boolean {
  return vorgang?.latestMessageDirection === "outgoing";
}

/** Letzte Thread-Nachricht kam vom Unternehmen — Kunde muss noch antworten. */
export function isVorgangAwaitingCustomerReply(vorgang: Vorgang): boolean {
  // Erledigt + Unternehmensantwort: Status „Warten auf Antwort“, aber nicht aktiv offen.
  if (
    shouldSuppressReopenedVorgang(vorgang) &&
    vorgang.latestMessageDirection !== "outgoing"
  ) {
    return false;
  }

  return vorgang.latestMessageDirection === "outgoing";
}

/** Aktive offene Vorgänge für Sidebar, Prioritäten und Arbeitstag. */
export function isVorgangActiveOpen(vorgang: Vorgang): boolean {
  if (vorgang.typ === "helpy_report") {
    return false;
  }

  if (shouldSuppressReopenedVorgang(vorgang)) {
    return false;
  }

  if (vorgang.status === "erledigt") {
    return false;
  }

  if (isVorgangAwaitingCustomerReply(vorgang)) {
    return false;
  }

  return true;
}

export function getEffectiveVorgangPriority(vorgang: Vorgang): VorgangPriority {
  if (isVorgangAwaitingCustomerReply(vorgang)) {
    return "niedrig";
  }

  return vorgang.prioritaet;
}

export function resolveVorgangStatusFromThread(
  vorgang: Vorgang,
  snapshot: GmailThreadSnapshot,
  previous?: Vorgang | null
): VorgangStatus {
  // Unternehmensantwort öffnet erledigte Vorgänge nie — Status „Warten auf Antwort“.
  if (snapshot.latestMessageDirection === "outgoing") {
    return "wartend";
  }

  if (shouldSuppressReopenedVorgang(vorgang, snapshot.latestMessageAt)) {
    return "erledigt";
  }

  if (wasAwaitingCustomerReply(previous)) {
    return "neu";
  }

  if (vorgang.status === "erledigt" || isVorgangCompleted(vorgang)) {
    return "neu";
  }

  return vorgang.status;
}

export function applyThreadSnapshotToVorgang(
  vorgang: Vorgang,
  snapshot: GmailThreadSnapshot,
  previous?: Vorgang | null
): Vorgang {
  if (vorgang.typ === "helpy_report") {
    return vorgang;
  }

  const snapshotVorgang: Vorgang = {
    ...vorgang,
    latestMessageDirection: snapshot.latestMessageDirection,
    latestMessageAt: snapshot.latestMessageAt,
    emailDate: snapshot.latestMessageAt,
  };

  if (
    isVorgangCompleted(vorgang) &&
    snapshot.latestMessageDirection === "incoming" &&
    !shouldSuppressReopenedVorgang(snapshotVorgang, snapshot.latestMessageAt)
  ) {
    clearCompletedVorgangIfReopened(snapshotVorgang);
  }

  const status = resolveVorgangStatusFromThread(vorgang, snapshot, previous);
  const awaitingReply = snapshot.latestMessageDirection === "outgoing";
  const reopenedFromWaiting =
    snapshot.latestMessageDirection === "incoming" &&
    wasAwaitingCustomerReply(previous);

  const normalizedLatestAt = normalizeMailTimestampToIso(snapshot.latestMessageAt);
  const syncedReceivedAt =
    snapshot.latestMessageDirection === "incoming" && normalizedLatestAt
      ? normalizedLatestAt
      : vorgang.receivedAt;

  const next: Vorgang = {
    ...vorgang,
    latestMessageDirection: snapshot.latestMessageDirection,
    latestMessageFrom: snapshot.latestMessageFrom,
    latestMessageAt: normalizedLatestAt ?? snapshot.latestMessageAt,
    hasUnreadExternalMessage: snapshot.hasUnreadExternalMessage,
    emailDate: normalizedLatestAt ?? snapshot.latestMessageAt,
    receivedAt: syncedReceivedAt,
    receivedLabel:
      snapshot.latestMessageDirection === "incoming"
        ? formatGmailDateTime(snapshot.latestMessageAt)
        : vorgang.receivedLabel,
    status,
    prioritaet: awaitingReply ? "niedrig" : vorgang.prioritaet,
    helpyStatus: awaitingReply
      ? GMAIL_WAITING_FOR_REPLY_STATUS
      : vorgang.helpyStatus,
  };

  if (awaitingReply && !wasAwaitingCustomerReply(previous)) {
    recordGmailReplySent(vorgang.id);
    startFollowUpFromGmailSend(vorgang, snapshot.latestMessageAt);
  }

  if (awaitingReply) {
    return {
      ...next,
      helpyMessage: VORGANG_ALREADY_REPLIED_HELpy_MESSAGE,
    };
  }

  if (reopenedFromWaiting) {
    return {
      ...next,
      helpyMessage: VORGANG_CUSTOMER_REPLIED_HELpy_MESSAGE,
    };
  }

  return next;
}

export function applyThreadSnapshotsToVorgaenge(
  vorgaenge: Vorgang[],
  snapshots: Map<string, GmailThreadSnapshot>,
  previousVorgaenge: Vorgang[] = []
): Vorgang[] {
  const previousByThread = new Map<string, Vorgang>();
  for (const item of previousVorgaenge) {
    if (item.threadId) {
      previousByThread.set(item.threadId, item);
    }
  }

  return vorgaenge.map((vorgang) => {
    if (!vorgang.threadId) return vorgang;
    const snapshot = snapshots.get(vorgang.threadId);
    if (!snapshot) return vorgang;
    return applyThreadSnapshotToVorgang(
      vorgang,
      snapshot,
      previousByThread.get(vorgang.threadId)
    );
  });
}
