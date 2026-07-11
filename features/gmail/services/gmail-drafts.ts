import { GmailConnectorError } from "@/features/gmail/services/gmail/connector";
import { extractEmailAddress } from "@/features/gmail/services/extract-email-address";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";

export type CreateGmailDraftInput = {
  accessToken: string;
  to: string;
  subject: string;
  body: string;
  threadId?: string;
};

export type CreateGmailDraftResult =
  | { ok: true; draftId: string }
  | { ok: false; error: string };

type GmailDraftResponse = {
  id: string;
  message?: {
    id: string;
    threadId?: string;
  };
};

export type GmailMimeAttachment = {
  filename: string;
  mimeType: string;
  /** Raw base64 (not base64url) */
  contentBase64: string;
};

function buildMimeMessage(input: {
  to: string;
  subject: string;
  body: string;
  html?: string;
  attachments?: GmailMimeAttachment[];
}): string {
  const attachments = input.attachments ?? [];

  if (attachments.length === 0 && !input.html) {
    return [
      `To: ${input.to}`,
      `Subject: ${input.subject}`,
      "Content-Type: text/plain; charset=UTF-8",
      "MIME-Version: 1.0",
      "",
      input.body,
    ].join("\r\n");
  }

  if (attachments.length === 0 && input.html) {
    const boundary = `helpy_alt_${Date.now()}`;
    return [
      `To: ${input.to}`,
      `Subject: ${input.subject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      input.body,
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      input.html,
      `--${boundary}--`,
    ].join("\r\n");
  }

  const boundary = `helpy_boundary_${Date.now()}`;
  const parts: string[] = [
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    input.body,
  ];

  for (const attachment of attachments) {
    const safeName = attachment.filename.replace(/"/g, "");
    parts.push(
      `--${boundary}`,
      `Content-Type: ${attachment.mimeType}; name="${safeName}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${safeName}"`,
      "",
      attachment.contentBase64.replace(/(.{76})/g, "$1\r\n")
    );
  }

  parts.push(`--${boundary}--`);
  return parts.join("\r\n");
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function toGermanError(error: unknown, context: "create" | "send"): string {
  if (error instanceof GmailConnectorError) {
    if (error.status === 401 || error.status === 403) {
      return context === "send"
        ? GMAIL_SEND_ERROR_MESSAGE
        : "Kein Zugriff auf Gmail. Bitte melde dich erneut mit Google an.";
    }
    if (error.status === 429) {
      return "Gmail ist gerade ausgelastet. Bitte versuche es in Kürze erneut.";
    }
    return context === "send"
      ? GMAIL_SEND_ERROR_MESSAGE
      : "Gmail-Entwurf konnte nicht erstellt werden.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return context === "send"
    ? GMAIL_SEND_ERROR_MESSAGE
    : "Gmail-Entwurf konnte nicht erstellt werden.";
}

/** Erstellt einen Gmail-Entwurf — sendet keine E-Mail. */
export async function createGmailDraft(
  input: CreateGmailDraftInput
): Promise<CreateGmailDraftResult> {
  const { accessToken, to, subject, body, threadId } = input;

  if (!accessToken) {
    return { ok: false, error: "Nicht mit Google verbunden." };
  }

  if (!to.trim() || !subject.trim() || !body.trim()) {
    return { ok: false, error: "Entwurf ist unvollständig." };
  }

  const raw = encodeBase64Url(
    buildMimeMessage({
      to: to.trim(),
      subject: subject.trim(),
      body,
    })
  );

  const payload: {
    message: {
      raw: string;
      threadId?: string;
    };
  } = {
    message: { raw },
  };

  if (threadId) {
    payload.message.threadId = threadId;
  }

  try {
    const response = await fetch(`${GMAIL_API_BASE}/users/me/drafts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new GmailConnectorError(
        detail || `Gmail API Fehler (${response.status})`,
        response.status
      );
    }

    const data = (await response.json()) as GmailDraftResponse;

    return {
      ok: true,
      draftId: data.id,
    };
  } catch (error) {
    return {
      ok: false,
      error: toGermanError(error, "create"),
    };
  }
}

export type SendGmailMessageInput = {
  accessToken: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  threadId?: string;
  attachments?: GmailMimeAttachment[];
};

export type SendGmailMessageResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

/** Sendet eine E-Mail direkt über die Gmail API — nur nach expliziter Nutzer-Bestätigung. */
export async function sendGmailMessage(
  input: SendGmailMessageInput
): Promise<SendGmailMessageResult> {
  const { accessToken, to, subject, body, html, threadId, attachments } = input;

  if (!accessToken) {
    return { ok: false, error: GMAIL_SEND_ERROR_MESSAGE };
  }

  const recipientEmail = extractEmailAddress(to);
  if (!recipientEmail) {
    return { ok: false, error: "Empfänger konnte nicht eindeutig erkannt werden." };
  }

  if (!subject.trim() || !body.trim()) {
    return { ok: false, error: "Antwort ist unvollständig." };
  }

  const raw = encodeBase64Url(
    buildMimeMessage({
      to: recipientEmail,
      subject: subject.trim(),
      body,
      html,
      attachments,
    })
  );

  const payload: {
    raw: string;
    threadId?: string;
  } = { raw };

  if (threadId) {
    payload.threadId = threadId;
  }

  try {
    const response = await fetch(`${GMAIL_API_BASE}/users/me/messages/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new GmailConnectorError(
        detail || `Gmail API Fehler (${response.status})`,
        response.status
      );
    }

    const data = (await response.json()) as { id?: string };

    return {
      ok: true,
      messageId: data.id ?? "sent",
    };
  } catch (error) {
    return {
      ok: false,
      error: toGermanError(error, "send"),
    };
  }
}

export const GMAIL_SEND_CONFIRM_BUTTON_LABEL =
  "Bestätigen & über Gmail senden";

export const GMAIL_SEND_MODAL_TITLE = "E-Mail wirklich senden?";

export const GMAIL_SEND_MODAL_HINT =
  "Bitte prüfe Empfänger, Betreff und Inhalt final.";

export const GMAIL_RETRY_BUTTON_LABEL = "Erneut versuchen";

export const GMAIL_SEND_SUCCESS_MESSAGE =
  "E-Mail erfolgreich über Gmail versendet.";

export const GMAIL_SEND_STATUS = "Gesendet";

export const GMAIL_SEND_ERROR_MESSAGE =
  "Gmail konnte die E-Mail nicht senden. Bitte Verbindung prüfen.";

export const GMAIL_SEND_LOADING_MESSAGE =
  "E-Mail wird über Gmail gesendet...";

export const GMAIL_WAITING_FOR_REPLY_STATUS = "Warten auf Antwort";
