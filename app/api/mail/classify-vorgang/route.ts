import { NextResponse } from "next/server";
import {
  classifyMailsForVorgangServer,
  type MailClassificationInput,
} from "@/features/mail/services/mail-vorgang-classifier";
import { requireSkillAccessApi } from "@/lib/auth/require-skill-access";

export async function POST(request: Request): Promise<NextResponse> {
  const access = await requireSkillAccessApi();
  if (!access.ok) return access.response;

  let body: { messages?: MailClassificationInput[] };
  try {
    body = (await request.json()) as { messages?: MailClassificationInput[] };
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const messages = body.messages ?? [];
  if (messages.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const classified = await classifyMailsForVorgangServer(messages.slice(0, 20));

  return NextResponse.json({
    results: messages.map((message) => ({
      messageId: message.messageId,
      ...(classified.get(message.messageId) ?? {
        ist_vorgang: false,
        grund: "Keine Klassifikation verfügbar",
        kategorie: "system_mail",
        absender_typ: "unbekannt",
      }),
    })),
  });
}
