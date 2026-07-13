import { NextResponse } from "next/server";
import type { AppointmentSlot } from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import { generateIntelligentReplyDraft } from "@/features/reply-drafts/services/reply-generation-pipeline";
import type { ReplyDraftInput } from "@/features/reply-drafts/types/reply-draft-types";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";

type GenerateReplyDraftBody = {
  draftInput: ReplyDraftInput;
  mailBody: string;
  appointmentSlots?: AppointmentSlot[];
};

function parseBody(body: unknown): GenerateReplyDraftBody | null {
  if (!body || typeof body !== "object") return null;
  const parsed = body as Partial<GenerateReplyDraftBody>;
  if (!parsed.draftInput || typeof parsed.mailBody !== "string") return null;
  if (!parsed.mailBody.trim()) return null;
  return {
    draftInput: parsed.draftInput,
    mailBody: parsed.mailBody,
    appointmentSlots: parsed.appointmentSlots,
  };
}

export async function POST(request: Request) {
  const auth = await requireCompanyContext();
  if (!auth.ok) {
    const devContext = createDevCompanyContext();
    if (!devContext) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request." }, { status: 400 });
  }

  const parsed = parseBody(body);
  if (!parsed) {
    return NextResponse.json({ error: "Ungültige Eingabedaten." }, { status: 400 });
  }

  try {
    const result = await generateIntelligentReplyDraft({
      draftInput: parsed.draftInput,
      mailBody: parsed.mailBody,
      appointmentSlots: parsed.appointmentSlots ?? [],
      preferGpt: true,
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error(
      "[reply-drafts/generate]",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Antwort konnte nicht generiert werden." },
      { status: 500 }
    );
  }
}
