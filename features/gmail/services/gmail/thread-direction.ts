import { extractEmailAddress } from "@/features/gmail/services/extract-email-address";
import type { GmailConnectorMessage } from "@/features/gmail/services/gmail/types";

export type GmailMessageDirection = "incoming" | "outgoing";

export type GmailThreadSnapshot = {
  threadId: string;
  latestMessageId: string;
  latestMessageAt: string;
  latestMessageFrom: string;
  latestMessageDirection: GmailMessageDirection;
  hasUnreadExternalMessage: boolean;
};

export const VORGANG_ALREADY_REPLIED_HELpy_MESSAGE =
  "Auf diese Anfrage wurde bereits geantwortet. Ich warte auf eine Rückmeldung des Kunden.";

export const VORGANG_CUSTOMER_REPLIED_HELpy_MESSAGE =
  "Der Kunde hat erneut geantwortet.";

function parseMessageTimestamp(value?: string): number {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function normalizeOwnEmails(ownEmails: Array<string | null | undefined>): string[] {
  return [
    ...new Set(
      ownEmails
        .filter((email): email is string => Boolean(email?.trim()))
        .map((email) => email.trim().toLowerCase())
    ),
  ];
}

/** Bestimmt ob eine Nachricht vom Unternehmen oder vom Kunden stammt. */
export function resolveMessageDirection(
  message: Pick<GmailConnectorMessage, "from" | "labelIds" | "direction">,
  ownEmails: Array<string | null | undefined> = []
): GmailMessageDirection {
  if (message.direction) {
    return message.direction;
  }

  if (message.labelIds?.includes("SENT")) {
    return "outgoing";
  }

  if (message.labelIds?.includes("DRAFT")) {
    return "outgoing";
  }

  const fromEmail = extractEmailAddress(message.from);
  const normalizedOwn = normalizeOwnEmails(ownEmails);

  if (fromEmail && normalizedOwn.includes(fromEmail)) {
    return "outgoing";
  }

  return "incoming";
}

export function enrichGmailMessagesWithDirection(
  messages: GmailConnectorMessage[],
  ownEmails: Array<string | null | undefined> = []
): GmailConnectorMessage[] {
  return messages.map((message) => ({
    ...message,
    direction: resolveMessageDirection(message, ownEmails),
    isUnread: message.isUnread ?? message.labelIds?.includes("UNREAD") ?? false,
  }));
}

/** Analysiert einen Gmail-Thread und liefert die letzte relevante Nachricht. */
export function analyzeGmailThread(
  messages: GmailConnectorMessage[],
  ownEmails: Array<string | null | undefined> = []
): GmailThreadSnapshot | null {
  if (messages.length === 0) return null;

  const enriched = enrichGmailMessagesWithDirection(messages, ownEmails);
  const sorted = [...enriched].sort(
    (a, b) => parseMessageTimestamp(b.date) - parseMessageTimestamp(a.date)
  );
  const latest = sorted[0];

  const hasUnreadExternalMessage = enriched.some(
    (message) =>
      message.isUnread && resolveMessageDirection(message, ownEmails) === "incoming"
  );

  return {
    threadId: latest.threadId,
    latestMessageId: latest.id,
    latestMessageAt: latest.date,
    latestMessageFrom: latest.from,
    latestMessageDirection: resolveMessageDirection(latest, ownEmails),
    hasUnreadExternalMessage,
  };
}

export function buildThreadSnapshotsFromMessages(
  messages: GmailConnectorMessage[],
  ownEmails: Array<string | null | undefined> = []
): Map<string, GmailThreadSnapshot> {
  const groups = new Map<string, GmailConnectorMessage[]>();

  for (const message of messages) {
    const group = groups.get(message.threadId) ?? [];
    group.push(message);
    groups.set(message.threadId, group);
  }

  const snapshots = new Map<string, GmailThreadSnapshot>();
  for (const [threadId, threadMessages] of groups) {
    const snapshot = analyzeGmailThread(threadMessages, ownEmails);
    if (snapshot) {
      snapshots.set(threadId, snapshot);
    }
  }

  return snapshots;
}
