import { NextResponse } from "next/server";
import { fetchGmailMessageById } from "@/features/gmail/services/gmail/connector";
import { requireSkillAccessApi } from "@/lib/auth/require-skill-access";
import {
  listValidGoogleTokensForCompany,
  requireOAuthContext,
} from "@/lib/oauth";

type RouteParams = {
  params: Promise<{ messageId: string }>;
};

/** Lädt Original-Mail-Body via Gmail API (on-demand). */
export async function GET(_request: Request, { params }: RouteParams) {
  const access = await requireSkillAccessApi();
  if (!access.ok) return access.response;

  const auth = await requireOAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { messageId } = await params;
  if (!messageId?.trim()) {
    return NextResponse.json({ error: "messageId fehlt." }, { status: 400 });
  }

  const accounts = await listValidGoogleTokensForCompany(auth.context.companyId);
  if (accounts.length === 0) {
    return NextResponse.json(
      { error: "Kein Gmail-Konto verbunden." },
      { status: 404 }
    );
  }

  let lastError = "Nachricht konnte nicht geladen werden.";

  for (const account of accounts) {
    try {
      const message = await fetchGmailMessageById(
        account.tokens.accessToken,
        messageId.trim()
      );

      return NextResponse.json({
        messageId: message.id,
        threadId: message.threadId,
        subject: message.subject,
        from: message.from,
        to: message.to,
        date: message.date,
        body: message.bodyText,
        snippet: message.snippet,
      });
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Gmail API Fehler.";
    }
  }

  return NextResponse.json({ error: lastError }, { status: 502 });
}
