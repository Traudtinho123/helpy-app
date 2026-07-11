import type {
  GraphMessage,
  GraphMessageListResponse,
  GraphSendMailPayload,
} from "@/features/outlook/types/outlook-types";
import {
  getValidOutlookAccessToken,
  type OutlookStoredTokens,
} from "@/features/outlook/services/outlook-auth-server";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export class OutlookMailClientError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "OutlookMailClientError";
  }
}

async function graphFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${GRAPH_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new OutlookMailClientError(
      detail || `Microsoft Graph Fehler (${response.status})`,
      response.status
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function fetchOutlookInboxMessages(
  tokens: OutlookStoredTokens,
  maxResults = 50
): Promise<GraphMessage[]> {
  const params = new URLSearchParams({
    $top: String(maxResults),
    $orderby: "receivedDateTime desc",
    $select:
      "id,conversationId,subject,bodyPreview,from,toRecipients,receivedDateTime,isRead,hasAttachments",
  });

  const data = await graphFetch<GraphMessageListResponse>(
    tokens.accessToken,
    `/me/mailFolders/inbox/messages?${params.toString()}`
  );

  return data.value ?? [];
}

/** Lädt Nachrichten über GET /me/messages (Microsoft Graph). */
export async function fetchOutlookMessages(
  tokens: OutlookStoredTokens,
  maxResults = 50
): Promise<GraphMessage[]> {
  const params = new URLSearchParams({
    $top: String(maxResults),
    $orderby: "receivedDateTime desc",
    $select:
      "id,conversationId,subject,bodyPreview,from,toRecipients,receivedDateTime,isRead,hasAttachments",
  });

  const data = await graphFetch<GraphMessageListResponse>(
    tokens.accessToken,
    `/me/messages?${params.toString()}`
  );

  return data.value ?? [];
}

export async function fetchOutlookConversationMessages(
  tokens: OutlookStoredTokens,
  conversationId: string,
  maxResults = 50
): Promise<GraphMessage[]> {
  const params = new URLSearchParams({
    $top: String(maxResults),
    $orderby: "receivedDateTime desc",
    $filter: `conversationId eq '${conversationId.replace(/'/g, "''")}'`,
    $select:
      "id,conversationId,subject,bodyPreview,from,toRecipients,receivedDateTime,isRead,hasAttachments",
  });

  const data = await graphFetch<GraphMessageListResponse>(
    tokens.accessToken,
    `/me/messages?${params.toString()}`
  );

  return data.value ?? [];
}

export async function markOutlookMessageAsRead(
  tokens: OutlookStoredTokens,
  messageId: string
): Promise<void> {
  await graphFetch(
    tokens.accessToken,
    `/me/messages/${messageId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ isRead: true }),
    }
  );
}

export async function sendOutlookMail(
  tokens: OutlookStoredTokens,
  input: {
    to: string;
    subject: string;
    body: string;
  }
): Promise<void> {
  const payload: GraphSendMailPayload = {
    message: {
      subject: input.subject,
      body: {
        contentType: "Text",
        content: input.body,
      },
      toRecipients: [
        {
          emailAddress: {
            address: input.to,
          },
        },
      ],
    },
    saveToSentItems: true,
  };

  await graphFetch(tokens.accessToken, "/me/sendMail", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function withOutlookMailClient<T>(
  handler: (tokens: OutlookStoredTokens) => Promise<T>
): Promise<T> {
  const tokens = await getValidOutlookAccessToken();
  if (!tokens) {
    throw new OutlookMailClientError("Outlook ist nicht verbunden.", 401);
  }
  return handler(tokens);
}
