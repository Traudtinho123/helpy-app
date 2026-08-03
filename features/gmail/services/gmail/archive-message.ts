const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";

/** Entfernt Mail aus dem Posteingang und setzt optional HELPY_ERLEDIGT. */
export async function archiveGmailMessage(
  accessToken: string,
  messageId: string
): Promise<boolean> {
  if (!accessToken?.trim() || !messageId?.trim()) return false;

  try {
    const withLabel = await modifyGmailMessage(accessToken, messageId, {
      removeLabelIds: ["INBOX"],
      addLabelIds: ["HELPY_ERLEDIGT"],
    });
    if (withLabel) return true;

    return modifyGmailMessage(accessToken, messageId, {
      removeLabelIds: ["INBOX"],
    });
  } catch {
    return false;
  }
}

async function modifyGmailMessage(
  accessToken: string,
  messageId: string,
  body: { removeLabelIds?: string[]; addLabelIds?: string[] }
): Promise<boolean> {
  const response = await fetch(
    `${GMAIL_API_BASE}/users/me/messages/${messageId}/modify`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    if (response.status === 403) return false;
    return false;
  }

  return true;
}

export async function archiveGmailMessages(
  accessToken: string | null | undefined,
  messageIds: string[]
): Promise<number> {
  if (!accessToken?.trim()) return 0;

  let archived = 0;
  for (const messageId of [...new Set(messageIds.filter(Boolean))]) {
    const ok = await archiveGmailMessage(accessToken, messageId);
    if (ok) {
      archived += 1;
    } else {
      console.warn("[gmail] Mail konnte nicht archiviert werden:", messageId);
    }
  }

  return archived;
}
