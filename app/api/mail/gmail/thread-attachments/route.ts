import { NextResponse } from "next/server";
import { fetchGmailThreadMessages } from "@/features/gmail/services/gmail/connector";
import { enrichGmailMessagesWithDirection } from "@/features/gmail/services/gmail/thread-direction";
import {
  mapGmailAttachmentsToUnified,
  mergeThreadAttachments,
} from "@/features/mail/services/mail-attachment-mapper";
import { requireSkillAccessApi } from "@/lib/auth/require-skill-access";
import { getValidGoogleTokensForCompany, requireOAuthContext } from "@/lib/oauth";

/** Listet Anhänge eines Gmail-Threads on-demand (Metadaten only). */
export async function GET(request: Request) {
  const access = await requireSkillAccessApi();
  if (!access.ok) return access.response;

  const auth = await requireOAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const connectionId = url.searchParams.get("connectionId")?.trim();
  const threadId = url.searchParams.get("threadId")?.trim();

  if (!connectionId || !threadId) {
    return NextResponse.json(
      { error: "connectionId und threadId sind erforderlich." },
      { status: 400 }
    );
  }

  const tokens = await getValidGoogleTokensForCompany(
    auth.context.companyId,
    connectionId
  );

  if (!tokens) {
    return NextResponse.json(
      { error: "Gmail-Verbindung nicht gefunden." },
      { status: 404 }
    );
  }

  try {
    const rawMessages = await fetchGmailThreadMessages(
      tokens.tokens.accessToken,
      threadId
    );
    const messages = enrichGmailMessagesWithDirection(rawMessages, [
      tokens.tokens.accountEmail,
    ]);

    const attachments = mergeThreadAttachments(
      messages.flatMap((message) =>
        mapGmailAttachmentsToUnified({
          message,
          connectionId,
          sourceAccountEmail: tokens.tokens.accountEmail,
        })
      )
    );

    return NextResponse.json({ ok: true, attachments });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Thread-Anhänge konnten nicht geladen werden.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
