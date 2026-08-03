import { createClient } from "@/lib/supabase/client";
import { migrateLegacyOAuthTokens } from "@/features/oauth/services/oauth-connections-client";

export type GmailSendInput = {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
  inReplyTo?: string;
};

export type GmailSendApiErrorCode =
  | "not_connected"
  | "token_expired"
  | "send_failed";

export type GmailSendViaApiResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string; errorCode?: GmailSendApiErrorCode };

async function buildGmailAuthHeaders(): Promise<Record<string, string>> {
  await migrateLegacyOAuthTokens();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const supabase = createClient();
  if (!supabase) return headers;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.provider_token) {
    headers["x-gmail-access-token"] = session.provider_token;
    if (session.provider_refresh_token) {
      headers["x-gmail-refresh-token"] = session.provider_refresh_token;
    }
    if (session.user?.email) {
      headers["x-gmail-account-email"] = session.user.email;
    }
  }

  return headers;
}

/** Sendet über POST /api/gmail/send (oauth_connections + Session-Fallback). */
export async function sendGmailMessageViaApi(
  input: GmailSendInput
): Promise<GmailSendViaApiResult> {
  try {
    const headers = await buildGmailAuthHeaders();
    const response = await fetch("/api/gmail/send", {
      method: "POST",
      headers,
      body: JSON.stringify(input),
      cache: "no-store",
    });

    const payload = (await response.json()) as
      | { ok: true; messageId: string }
      | { ok: false; error: string; errorCode?: GmailSendApiErrorCode };

    if (!payload.ok) {
      return {
        ok: false,
        error: payload.error,
        errorCode: payload.errorCode,
      };
    }

    return { ok: true, messageId: payload.messageId };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Gmail konnte die E-Mail nicht senden.",
      errorCode: "send_failed",
    };
  }
}
