import {
  decodeGmailAttachmentData,
  extractGmailAttachmentsFromPayload,
} from "@/features/gmail/services/gmail/attachment-parser";
import type {
  GmailAttachmentData,
  GmailAttachmentMeta,
  GmailConnectorMessage,
  GmailListResponse,
  GmailMessagePayload,
  GmailThreadPayload,
} from "@/features/gmail/services/gmail/types";
import {
  enrichGmailMessagesWithDirection,
} from "@/features/gmail/services/gmail/thread-direction";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";

export class GmailConnectorError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "GmailConnectorError";
  }
}

function getHeader(
  headers: Array<{ name: string; value: string }> | undefined,
  name: string
): string {
  return (
    headers?.find((header) => header.name.toLowerCase() === name.toLowerCase())
      ?.value ?? ""
  );
}

function resolveDate(message: GmailMessagePayload): string {
  const dateHeader = getHeader(message.payload?.headers, "Date");
  if (dateHeader) {
    const parsed = Date.parse(dateHeader);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  if (message.internalDate) {
    return new Date(Number(message.internalDate)).toISOString();
  }
  return "";
}

function mapMessage(message: GmailMessagePayload): GmailConnectorMessage {
  const attachments = extractGmailAttachmentsFromPayload(message.payload);

  return {
    id: message.id,
    threadId: message.threadId,
    subject: getHeader(message.payload?.headers, "Subject") || "(Kein Betreff)",
    from: getHeader(message.payload?.headers, "From") || "(Unbekannt)",
    snippet: message.snippet ?? "",
    date: resolveDate(message),
    labelIds: message.labelIds,
    isUnread: message.labelIds?.includes("UNREAD") ?? false,
    attachments,
  };
}

async function gmailFetch<T>(
  accessToken: string,
  path: string
): Promise<T> {
  const response = await fetch(`${GMAIL_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new GmailConnectorError(
      detail || `Gmail API Fehler (${response.status})`,
      response.status
    );
  }

  return response.json() as Promise<T>;
}

async function fetchMessageFull(
  accessToken: string,
  messageId: string
): Promise<GmailConnectorMessage> {
  const params = new URLSearchParams({ format: "full" });
  const message = await gmailFetch<GmailMessagePayload>(
    accessToken,
    `/users/me/messages/${messageId}?${params.toString()}`
  );
  return mapMessage(message);
}

/** Lädt alle Nachrichten eines Gmail-Threads inkl. Anhang-Metadaten. */
export async function fetchGmailThreadMessages(
  accessToken: string,
  threadId: string
): Promise<GmailConnectorMessage[]> {
  const params = new URLSearchParams({ format: "full" });
  const thread = await gmailFetch<GmailThreadPayload>(
    accessToken,
    `/users/me/threads/${threadId}?${params.toString()}`
  );

  return (thread.messages ?? []).map(mapMessage);
}

export type FetchRecentGmailMessagesOptions = {
  ownEmail?: string | null;
};

/** Lädt die letzten Gmail-Nachrichten inkl. Anhang-Metadaten. */
export async function fetchRecentGmailMessages(
  accessToken: string,
  maxResults = 10,
  options: FetchRecentGmailMessagesOptions = {}
): Promise<GmailConnectorMessage[]> {
  const list = await gmailFetch<GmailListResponse>(
    accessToken,
    `/users/me/messages?maxResults=${maxResults}`
  );

  const refs = list.messages ?? [];
  if (refs.length === 0) return [];

  const messages = await Promise.all(
    refs.map((ref) => fetchMessageFull(accessToken, ref.id))
  );

  return enrichGmailMessagesWithDirection(
    messages,
    options.ownEmail ? [options.ownEmail] : []
  );
}

/** Lädt Anhang-Bytes on-demand (kein dauerhafter Speicher). */
export async function fetchGmailAttachmentData(
  accessToken: string,
  messageId: string,
  attachment: Pick<GmailAttachmentMeta, "attachmentId" | "fileName" | "mimeType" | "size">
): Promise<GmailAttachmentData> {
  const payload = await gmailFetch<{ data?: string; size?: number }>(
    accessToken,
    `/users/me/messages/${messageId}/attachments/${attachment.attachmentId}`
  );

  if (!payload.data) {
    throw new GmailConnectorError("Gmail-Anhang ohne Daten.", 404);
  }

  const data = decodeGmailAttachmentData(payload.data);
  if (data.length === 0) {
    throw new GmailConnectorError("Gmail-Anhang konnte nicht dekodiert werden.", 502);
  }

  return {
    attachmentId: attachment.attachmentId,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    size: attachment.size || payload.size || data.length,
    data,
  };
}

export { extractGmailAttachmentsFromPayload };
