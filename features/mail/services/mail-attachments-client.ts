import type { UnifiedMailAttachment } from "@/features/mail/types/unified-mail-types";
import { buildGmailAttachmentProxyUrl } from "@/features/mail/services/mail-attachment-mapper";

export async function fetchGmailThreadAttachments(input: {
  connectionId: string;
  threadId: string;
}): Promise<UnifiedMailAttachment[]> {
  const params = new URLSearchParams({
    connectionId: input.connectionId,
    threadId: input.threadId,
  });

  const response = await fetch(`/api/mail/gmail/thread-attachments?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) return [];

  const payload = (await response.json()) as {
    attachments?: UnifiedMailAttachment[];
  };

  return payload.attachments ?? [];
}

export function getMailAttachmentOpenUrl(attachment: UnifiedMailAttachment): string {
  return buildGmailAttachmentProxyUrl(attachment);
}

export function getMailAttachmentDownloadUrl(attachment: UnifiedMailAttachment): string {
  return buildGmailAttachmentProxyUrl(attachment);
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function attachmentDirectionLabel(
  direction: UnifiedMailAttachment["direction"]
): string {
  return direction === "outgoing" ? "Von mir gesendet" : "Von Kunde";
}
