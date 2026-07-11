"use server";

import {
  fetchRecentGmailMessages,
  GmailConnectorError,
} from "@/features/gmail/services/gmail/connector";
import type { GmailConnectorMessage } from "@/features/gmail/services/gmail/types";

export type DebugGmailResult =
  | { ok: true; messages: GmailConnectorMessage[] }
  | { ok: false; error: string };

export async function loadDebugGmailMessages(
  accessToken: string
): Promise<DebugGmailResult> {
  if (!accessToken) {
    return { ok: false, error: "Nicht mit Google verbunden" };
  }

  try {
    const messages = await fetchRecentGmailMessages(accessToken, 10);
    return { ok: true, messages };
  } catch (caught) {
    if (caught instanceof GmailConnectorError) {
      return { ok: false, error: caught.message };
    }
    if (caught instanceof Error) {
      return { ok: false, error: caught.message };
    }
    return { ok: false, error: "Gmail konnte nicht geladen werden." };
  }
}
