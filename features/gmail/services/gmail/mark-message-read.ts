import { GmailConnectorError } from "@/features/gmail/services/gmail/connector";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";

/** Markiert eine Gmail-Nachricht als gelesen (entfernt UNREAD-Label). */
export async function markGmailMessageAsRead(
  accessToken: string,
  messageId: string
): Promise<void> {
  const response = await fetch(
    `${GMAIL_API_BASE}/users/me/messages/${messageId}/modify`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        removeLabelIds: ["UNREAD"],
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new GmailConnectorError(
      detail || `Gmail konnte nicht aktualisiert werden (${response.status})`,
      response.status
    );
  }
}

export async function markGmailMessagesAsRead(
  accessToken: string,
  messageIds: string[]
): Promise<{ ok: string[]; failed: string[] }> {
  const ok: string[] = [];
  const failed: string[] = [];

  for (const messageId of [...new Set(messageIds.filter(Boolean))]) {
    try {
      await markGmailMessageAsRead(accessToken, messageId);
      ok.push(messageId);
    } catch {
      failed.push(messageId);
    }
  }

  return { ok, failed };
}
