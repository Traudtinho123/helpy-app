import type { UnifiedMailMessage } from "@/features/mail/types/unified-mail-types";
import type { OutlookSyncResponse } from "@/features/outlook/types/outlook-types";
import { sendOutlookMessageViaApi } from "@/features/outlook/services/outlook-send-service";
import {
  getOutlookConnectionState,
  refreshOutlookConnectionStatus,
} from "@/features/outlook/services/outlook-auth-service";

export type OutlookClientSyncResult =
  | {
      ok: true;
      messages: UnifiedMailMessage[];
      accountEmail: string | null;
      syncedAt: string;
    }
  | { ok: false; error: string };

/** Lädt Outlook-Nachrichten über die Server-API (Microsoft Graph). */
export async function syncOutlookMessagesFromApi(): Promise<OutlookClientSyncResult> {
  const connection = getOutlookConnectionState();
  if (connection.status !== "connected") {
    await refreshOutlookConnectionStatus();
  }

  try {
    const response = await fetch("/api/outlook/mail/sync", {
      method: "POST",
      cache: "no-store",
    });

    const payload = (await response.json()) as OutlookSyncResponse;

    if (!payload.ok) {
      return { ok: false, error: payload.error };
    }

    await refreshOutlookConnectionStatus();

    return {
      ok: true,
      messages: payload.messages,
      accountEmail: payload.accountEmail,
      syncedAt: payload.syncedAt,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Outlook-Sync fehlgeschlagen.",
    };
  }
}

export async function sendOutlookMessageFromApi(input: {
  to: string;
  subject: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await sendOutlookMessageViaApi(input);
  if (!result.ok) {
    return result;
  }

  await syncOutlookMessagesFromApi();
  return { ok: true };
}

export async function markOutlookMessageReadFromApi(
  messageId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch("/api/outlook/mail/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId }),
    });

    const payload = (await response.json()) as
      | { ok: true }
      | { ok: false; error: string };

    return payload.ok ? { ok: true } : payload;
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Outlook-Nachricht konnte nicht gelesen markiert werden.",
    };
  }
}
