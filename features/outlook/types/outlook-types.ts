export type OutlookConnectionStatus = "disconnected" | "connected" | "error";

export type OutlookConnectionState = {
  status: OutlookConnectionStatus;
  accountEmail: string | null;
  connectedAt: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
  messagesToday: number;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
};

export type OutlookSyncResponse = {
  ok: true;
  messages: import("@/features/mail/types/unified-mail-types").UnifiedMailMessage[];
  accountEmail: string | null;
  syncedAt: string;
} | {
  ok: false;
  error: string;
};

export const OUTLOOK_CONNECT_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "User.Read",
  "Mail.Read",
  "Mail.Send",
] as const;

export type GraphEmailAddress = {
  name?: string;
  address: string;
};

export type GraphRecipient = {
  emailAddress: GraphEmailAddress;
};

export type GraphMessage = {
  id: string;
  conversationId: string;
  subject?: string;
  bodyPreview?: string;
  from?: GraphRecipient;
  toRecipients?: GraphRecipient[];
  receivedDateTime: string;
  isRead?: boolean;
  hasAttachments?: boolean;
};

export type GraphMessageListResponse = {
  value: GraphMessage[];
};

export type GraphSendMailPayload = {
  message: {
    subject: string;
    body: {
      contentType: "Text" | "HTML";
      content: string;
    };
    toRecipients: GraphRecipient[];
  };
  saveToSentItems?: boolean;
};
