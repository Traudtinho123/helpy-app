import { NextResponse } from "next/server";
import { sendGmailMessage } from "@/features/gmail/services/gmail-drafts";
import { requireSkillAccessApi } from "@/lib/auth/require-skill-access";
import {
  getValidGoogleTokensForCompany,
  requireOAuthContext,
} from "@/lib/oauth";

export const dynamic = "force-dynamic";

type GmailSendBody = {
  to?: string;
  subject?: string;
  body?: string;
  threadId?: string;
  inReplyTo?: string;
};

export async function POST(request: Request): Promise<NextResponse> {
  const access = await requireSkillAccessApi();
  if (!access.ok) return access.response;

  const auth = await requireOAuthContext();
  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Nicht angemeldet.",
        errorCode: "token_expired" as const,
      },
      { status: auth.status }
    );
  }

  let body: GmailSendBody;
  try {
    body = (await request.json()) as GmailSendBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Ungültiger Request-Body.", errorCode: "send_failed" },
      { status: 400 }
    );
  }

  if (!body.to?.trim() || !body.subject?.trim() || !body.body?.trim()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Empfänger, Betreff und Text sind erforderlich.",
        errorCode: "send_failed",
      },
      { status: 400 }
    );
  }

  const account = await getValidGoogleTokensForCompany(auth.context.companyId);
  if (!account?.tokens.accessToken) {
    console.warn("[gmail/send] no oauth_connections google token for company", {
      companyId: auth.context.companyId,
    });
    return NextResponse.json(
      {
        ok: false,
        error:
          "Gmail nicht verbunden. Bitte zuerst Gmail in Plattformen verbinden.",
        errorCode: "not_connected",
      },
      { status: 404 }
    );
  }

  console.info("[gmail/send] sending", {
    companyId: auth.context.companyId,
    connectionId: account.connectionId,
    accountEmail: account.tokens.accountEmail,
    to: body.to.trim(),
    subject: body.subject.trim(),
    threadId: body.threadId ?? null,
  });

  const result = await sendGmailMessage({
    accessToken: account.tokens.accessToken,
    to: body.to.trim(),
    subject: body.subject.trim(),
    body: body.body,
    threadId: body.threadId?.trim() || undefined,
  });

  if (!result.ok) {
    const isAuthError =
      result.error.includes("Verbindung prüfen") ||
      result.error.includes("Kein Zugriff");

    console.error("[gmail/send] failed:", {
      companyId: auth.context.companyId,
      accountEmail: account.tokens.accountEmail,
      error: result.error,
    });

    return NextResponse.json(
      {
        ok: false,
        error: isAuthError
          ? "Gmail-Verbindung abgelaufen. Bitte Gmail in Plattformen erneut verbinden."
          : result.error,
        errorCode: isAuthError ? "token_expired" : "send_failed",
      },
      { status: isAuthError ? 401 : 500 }
    );
  }

  console.info("[gmail/send] success", {
    companyId: auth.context.companyId,
    messageId: result.messageId,
  });

  return NextResponse.json({ ok: true, messageId: result.messageId });
}
