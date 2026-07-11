import type {
  MailMessageDirection,
  UnifiedMailMessage,
  UnifiedMailThreadSnapshot,
} from "@/features/mail/types/unified-mail-types";

function parseTimestamp(value?: string): number {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

/** Analysiert einen Mail-Thread provider-unabhängig. */
export function analyzeMailThread(
  messages: UnifiedMailMessage[]
): UnifiedMailThreadSnapshot | null {
  if (messages.length === 0) return null;

  const sorted = [...messages].sort(
    (a, b) => parseTimestamp(b.receivedAt) - parseTimestamp(a.receivedAt)
  );
  const latest = sorted[0];

  const hasUnreadExternalMessage = messages.some(
    (message) => message.isUnread && message.direction === "incoming"
  );

  return {
    provider: latest.provider,
    providerThreadId: latest.providerThreadId,
    latestMessageId: latest.providerMessageId,
    latestMessageAt: latest.receivedAt,
    latestMessageFrom: latest.from,
    latestMessageDirection: latest.direction,
    hasUnreadExternalMessage,
  };
}

export function resolveMailMessageDirection(
  message: Pick<UnifiedMailMessage, "direction">
): MailMessageDirection {
  return message.direction;
}

/** @deprecated Nutze analyzeMailThread */
export const analyzeUnifiedMailThread = analyzeMailThread;

/** @deprecated Nutze resolveMailMessageDirection */
export const resolveUnifiedMessageDirection = resolveMailMessageDirection;
