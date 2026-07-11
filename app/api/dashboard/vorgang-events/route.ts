import { NextResponse } from "next/server";
import { classifyVorgangForAnalytics } from "@/features/analytics/services/vorgang-event-classifier";
import { insertVorgangEvents } from "@/features/analytics/services/vorgang-events-repository";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import { requireOAuthContext } from "@/lib/oauth/require-oauth-context";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const auth = await requireOAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase ist nicht konfiguriert." }, { status: 503 });
  }

  let body: { vorgaenge?: unknown };
  try {
    body = (await request.json()) as { vorgaenge?: unknown };
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  if (!Array.isArray(body.vorgaenge)) {
    return NextResponse.json({ error: "Feld vorgaenge fehlt." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const rows = body.vorgaenge
    .map((item) => classifyVorgangForAnalytics(item as Vorgang))
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .map((item) => ({
      company_id: auth.context.companyId,
      user_id: auth.context.userId,
      provider: item.provider,
      provider_thread_id: item.providerThreadId,
      vorgang_id: item.vorgangId,
      typ: item.typ,
      intent: item.intent,
      intent_label: item.intentLabel,
      kunde_name: item.kundeName,
      prioritaet: item.prioritaet,
      is_appointment_request: item.isAppointmentRequest,
      is_new_inquiry: item.isNewInquiry,
      received_at: item.receivedAt,
      erkannt_at: now,
    }));

  try {
    const result = await insertVorgangEvents(supabase, rows);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Vorgang-Events konnten nicht gespeichert werden.";
    console.error("[vorgang-events] POST failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
