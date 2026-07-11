import { NextResponse } from "next/server";
import {
  markOutlookMessageAsRead,
  withOutlookMailClient,
} from "@/features/outlook/services/outlook-mail-client";
import { requireSkillAccessApi } from "@/lib/auth/require-skill-access";

export async function POST(request: Request): Promise<NextResponse> {
  const access = await requireSkillAccessApi();
  if (!access.ok) return access.response;

  try {
    const body = (await request.json()) as { messageId?: string };
    if (!body.messageId?.trim()) {
      return NextResponse.json(
        { ok: false, error: "messageId fehlt." },
        { status: 400 }
      );
    }

    await withOutlookMailClient((tokens) =>
      markOutlookMessageAsRead(tokens, body.messageId!.trim())
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Outlook-Nachricht konnte nicht gelesen markiert werden.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
