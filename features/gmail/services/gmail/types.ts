/** Gmail MIME-Teil (format=full). */
export type GmailMimePart = {
  partId?: string;
  mimeType?: string;
  filename?: string;
  body?: {
    attachmentId?: string;
    size?: number;
    data?: string;
  };
  parts?: GmailMimePart[];
};

export type GmailAttachmentMeta = {
  attachmentId: string;
  fileName: string;
  mimeType: string;
  size: number;
};

export type GmailMessagePayload = {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  labelIds?: string[];
  payload?: {
    mimeType?: string;
    filename?: string;
    headers?: Array<{ name: string; value: string }>;
    body?: { data?: string; attachmentId?: string; size?: number };
    parts?: GmailMimePart[];
  };
};

export type GmailListResponse = {
  messages?: GmailMessageRef[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
};

export type GmailMessageRef = {
  id: string;
  threadId: string;
};

export type GmailClientTokens = {
  accessToken?: string;
  refreshToken?: string;
};

/** Normalisierte Gmail-Nachricht aus dem Connector. */
export type GmailConnectorMessage = {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  labelIds?: string[];
  direction?: "incoming" | "outgoing";
  isUnread?: boolean;
  attachments?: GmailAttachmentMeta[];
};

export type GmailThreadPayload = {
  id: string;
  messages?: GmailMessagePayload[];
};

export type GmailAttachmentData = {
  attachmentId: string;
  fileName: string;
  mimeType: string;
  size: number;
  data: Buffer;
};
