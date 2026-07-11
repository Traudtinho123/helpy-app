import type {
  MailMessageDirection,
  MailProviderId,
  UnifiedMailAttachment,
} from "@/features/mail/types/unified-mail-types";
import { resolveAttachmentContentType } from "@/features/gmail/services/gmail/attachment-parser";
import type { GmailAttachmentMeta, GmailConnectorMessage } from "@/features/gmail/services/gmail/types";

type MapGmailAttachmentInput = {
  message: Pick<
    GmailConnectorMessage,
    "id" | "subject" | "date" | "direction" | "attachments"
  >;
  connectionId: string;
  sourceAccountEmail?: string | null;
};

export function buildUnifiedMailAttachmentId(
  provider: MailProviderId,
  messageId: string,
  attachmentId: string
): string {
  return `${provider}:${messageId}:${attachmentId}`;
}

export function mapGmailAttachmentsToUnified(
  input: MapGmailAttachmentInput
): UnifiedMailAttachment[] {
  const direction: MailMessageDirection =
    input.message.direction === "outgoing" ? "outgoing" : "incoming";

  return (input.message.attachments ?? []).map((attachment) =>
    mapSingleGmailAttachment({
      attachment,
      message: input.message,
      connectionId: input.connectionId,
      direction,
      sourceAccountEmail: input.sourceAccountEmail,
    })
  );
}

function mapSingleGmailAttachment(input: {
  attachment: GmailAttachmentMeta;
  message: Pick<GmailConnectorMessage, "id" | "subject" | "date">;
  connectionId: string;
  direction: MailMessageDirection;
  sourceAccountEmail?: string | null;
}): UnifiedMailAttachment {
  const { attachment, message, connectionId, direction } = input;

  return {
    id: buildUnifiedMailAttachmentId("gmail", message.id, attachment.attachmentId),
    provider: "gmail",
    name: attachment.fileName,
    contentType: resolveAttachmentContentType(
      attachment.fileName,
      attachment.mimeType
    ),
    size: attachment.size,
    providerMessageId: message.id,
    providerAttachmentId: attachment.attachmentId,
    messageSubject: message.subject,
    messageReceivedAt: message.date,
    direction,
    connectionId,
    sourceAccountEmail: input.sourceAccountEmail ?? null,
  };
}

/** Outlook: später analog befüllen — gleiche UnifiedMailAttachment-Struktur. */
export function mapOutlookAttachmentsToUnified(
  _messages: unknown,
  _connectionId: string
): UnifiedMailAttachment[] {
  return [];
}

export function mergeThreadAttachments(
  attachments: UnifiedMailAttachment[]
): UnifiedMailAttachment[] {
  return dedupeUnifiedMailAttachments(attachments);
}

function normalizeAttachmentDedupeKey(attachment: UnifiedMailAttachment): string {
  return `${attachment.name.trim().toLowerCase()}::${attachment.size}::${attachment.contentType}`;
}

/** Eine physische Datei pro Thread — auch wenn sie in mehreren Mails vorkommt. */
export function dedupeUnifiedMailAttachments(
  attachments: readonly UnifiedMailAttachment[]
): UnifiedMailAttachment[] {
  const byKey = new Map<string, UnifiedMailAttachment>();

  for (const attachment of attachments) {
    const key = normalizeAttachmentDedupeKey(attachment);
    const existing = byKey.get(key);
    if (
      !existing ||
      attachment.messageReceivedAt.localeCompare(existing.messageReceivedAt) > 0
    ) {
      byKey.set(key, attachment);
    }
  }

  return [...byKey.values()].sort((a, b) =>
    b.messageReceivedAt.localeCompare(a.messageReceivedAt)
  );
}

export function buildGmailAttachmentProxyUrl(attachment: UnifiedMailAttachment): string {
  const params = new URLSearchParams({
    connectionId: attachment.connectionId ?? "",
    messageId: attachment.providerMessageId,
    attachmentId: attachment.providerAttachmentId,
    fileName: attachment.name,
    mimeType: attachment.contentType,
  });
  return `/api/mail/attachments/gmail?${params.toString()}`;
}
