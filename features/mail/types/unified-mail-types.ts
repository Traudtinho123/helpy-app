/** Einheitliches Mail-Modell für Gmail, Outlook und weitere Provider. */

export type MailProviderId = "gmail" | "outlook";

export type MailMessageDirection = "incoming" | "outgoing";

export type UnifiedMailAttachment = {
  /** `${provider}:${messageId}:${attachmentId}` */
  id: string;
  provider: MailProviderId;
  name: string;
  contentType: string;
  size: number;
  providerMessageId: string;
  providerAttachmentId: string;
  messageSubject: string;
  messageReceivedAt: string;
  direction: MailMessageDirection;
  connectionId?: string;
  sourceAccountEmail?: string | null;
};

export type UnifiedMailMessage = {
  id: string;
  provider: MailProviderId;
  providerMessageId: string;
  providerThreadId: string;
  from: string;
  to: string[];
  subject: string;
  snippet: string;
  bodyPreview: string;
  receivedAt: string;
  hasAttachments: boolean;
  attachments: UnifiedMailAttachment[];
  isUnread: boolean;
  direction: MailMessageDirection;
  sourceAccountEmail: string | null;
  connectionId?: string;
};

export type UnifiedMailThreadSnapshot = {
  provider: MailProviderId;
  providerThreadId: string;
  latestMessageId: string;
  latestMessageAt: string;
  latestMessageFrom: string;
  latestMessageDirection: MailMessageDirection;
  hasUnreadExternalMessage: boolean;
};
