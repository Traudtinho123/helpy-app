import { NextResponse } from "next/server";
import { sendOutlookMailWithSession } from "@/features/outlook/services/outlook-send-server";
import { requireSkillAccessApi } from "@/lib/auth/require-skill-access";

export async function POST(request: Request): Promise<NextResponse> {
  const access = await requireSkillAccessApi();
  if (!access.ok) return access.response;

  try {
    const body = (await request.json()) as {
      to?: string;
      subject?: string;
      body?: string;
    };

    if (!body.to?.trim() || !body.subject?.trim() || !body.body?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Empfänger, Betreff und Text sind erforderlich." },
        { status: 400 }
      );
    }

    await sendOutlookMailWithSession({
      to: body.to!.trim(),
      subject: body.subject!.trim(),
      body: body.body!.trim(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Outlook konnte die E-Mail nicht senden.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
