import type { GmailConnectorMessage } from "@/features/gmail/services/gmail/types";
import { resolveMessageDirection } from "@/features/gmail/services/gmail/thread-direction";
import { extractEmailAddress } from "@/features/gmail/services/extract-email-address";
import type { GraphMessage } from "@/features/outlook/types/outlook-types";
import type { UnifiedMailMessage } from "@/features/mail/types/unified-mail-types";
import { mapGmailAttachmentsToUnified } from "@/features/mail/services/mail-attachment-mapper";

function formatGraphAddress(recipient?: {
  emailAddress?: { name?: string; address?: string };
}): string {
  if (!recipient?.emailAddress?.address) return "(Unbekannt)";
  const name = recipient.emailAddress.name?.trim();
  const address = recipient.emailAddress.address.trim();
  if (name && name.toLowerCase() !== address.toLowerCase()) {
    return `${name} <${address}>`;
  }
  return address;
}

function resolveOutlookDirection(
  message: GraphMessage,
  sourceAccountEmail: string | null
): UnifiedMailMessage["direction"] {
  const fromEmail = extractEmailAddress(formatGraphAddress(message.from));
  const ownEmail = sourceAccountEmail?.trim().toLowerCase() ?? null;
  if (fromEmail && ownEmail && fromEmail === ownEmail) {
    return "outgoing";
  }
  return "incoming";
}

export function mapGmailMessageToUnifiedMail(
  message: GmailConnectorMessage,
  sourceAccountEmail: string | null = null,
  connectionId?: string
): UnifiedMailMessage {
  const direction =
    message.direction ??
    resolveMessageDirection(message, sourceAccountEmail ? [sourceAccountEmail] : []);

  const attachments =
    connectionId && message.attachments?.length
      ? mapGmailAttachmentsToUnified({
          message: { ...message, direction },
          connectionId,
          sourceAccountEmail,
        })
      : [];

  return {
    id: `gmail:${message.id}`,
    provider: "gmail",
    providerMessageId: message.id,
    providerThreadId: message.threadId,
    from: message.from,
    to: [],
    subject: message.subject,
    snippet: message.snippet,
    bodyPreview: message.snippet,
    receivedAt: message.date,
    hasAttachments: attachments.length > 0,
    attachments,
    isUnread: message.isUnread ?? message.labelIds?.includes("UNREAD") ?? false,
    direction,
    sourceAccountEmail,
    connectionId,
  };
}

export function mapOutlookMessageToUnifiedMail(
  message: GraphMessage,
  sourceAccountEmail: string | null = null,
  connectionId?: string
): UnifiedMailMessage {
  const direction = resolveOutlookDirection(message, sourceAccountEmail);

  return {
    id: `outlook:${message.id}`,
    provider: "outlook",
    providerMessageId: message.id,
    providerThreadId: message.conversationId,
    from: formatGraphAddress(message.from),
    to: (message.toRecipients ?? []).map((recipient) =>
      formatGraphAddress(recipient)
    ),
    subject: message.subject?.trim() || "(Kein Betreff)",
    snippet: message.bodyPreview?.trim() || "",
    bodyPreview: message.bodyPreview?.trim() || "",
    receivedAt: message.receivedDateTime,
    hasAttachments: Boolean(message.hasAttachments),
    attachments: [],
    isUnread: !message.isRead,
    direction,
    sourceAccountEmail,
    connectionId,
  };
}

export function mapOutlookMessagesToUnifiedMail(
  messages: GraphMessage[],
  sourceAccountEmail: string | null = null,
  connectionId?: string
): UnifiedMailMessage[] {
  return messages.map((message) =>
    mapOutlookMessageToUnifiedMail(message, sourceAccountEmail, connectionId)
  );
}

export function mapUnifiedMailToGmailConnector(
  message: UnifiedMailMessage
): GmailConnectorMessage {
  return {
    id: message.providerMessageId,
    threadId: message.providerThreadId,
    subject: message.subject,
    from: message.from,
    snippet: message.snippet,
    date: message.receivedAt,
    direction: message.direction,
    isUnread: message.isUnread,
    labelIds: message.isUnread ? ["UNREAD"] : [],
    attachments: message.attachments.map((attachment) => ({
      attachmentId: attachment.providerAttachmentId,
      fileName: attachment.name,
      mimeType: attachment.contentType,
      size: attachment.size,
    })),
  };
}

/** @deprecated Nutze mapGmailMessageToUnifiedMail */
export const mapGmailConnectorToUnifiedMail = mapGmailMessageToUnifiedMail;

/** @deprecated Nutze mapOutlookMessageToUnifiedMail */
export const mapGraphMessageToUnifiedMail = mapOutlookMessageToUnifiedMail;

/** @deprecated Nutze mapOutlookMessagesToUnifiedMail */
export const mapGraphMessagesToUnifiedMail = mapOutlookMessagesToUnifiedMail;
