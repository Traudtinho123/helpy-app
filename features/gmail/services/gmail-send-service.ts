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

/** Sendet über POST /api/gmail/send (Server nutzt oauth_connections). */
export async function sendGmailMessageViaApi(
  input: GmailSendInput
): Promise<GmailSendViaApiResult> {
  try {
    const response = await fetch("/api/gmail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
