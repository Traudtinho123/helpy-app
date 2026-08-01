import { NextResponse } from "next/server";
import { generateHelpyChatReply } from "@/lib/helpy/helpy-chat-service";
import type { HelpyChatRequest } from "@/features/helpy-chat/types/helpy-chat-types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireCompanyContext } from "@/lib/tenant/require-company-context";

function parseBody(body: unknown): HelpyChatRequest | null {
  if (!body || typeof body !== "object") return null;
  const parsed = body as Partial<HelpyChatRequest>;
  if (typeof parsed.message !== "string" || !parsed.message.trim()) return null;
  return {
    message: parsed.message.trim(),
    history: parsed.history,
    context: parsed.context,
  };
}

export async function POST(request: Request) {
  const auth = await requireCompanyContext();
  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request." }, { status: 400 });
  }

  const parsed = parseBody(body);
  if (!parsed) {
    return NextResponse.json({ error: "Nachricht fehlt." }, { status: 400 });
  }

  try {
    const result = await generateHelpyChatReply(parsed);
    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "[helpy/chat]",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Antwort konnte nicht erstellt werden." },
      { status: 500 }
    );
  }
}
