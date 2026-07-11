import { NextResponse } from "next/server";
import { updateWhatsappMessageStatus } from "@/features/whatsapp/services/whatsapp-repository";
import type { WhatsappMessageStatusDb } from "@/lib/database/types";
import { resolveCompanyIdForUser } from "@/features/lead-scoring/services/lead-score-supabase";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set<WhatsappMessageStatusDb>([
  "neu",
  "in_bearbeitung",
  "erledigt",
  "archiviert",
]);

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, mode: "offline" });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const companyId = await resolveCompanyIdForUser(user.id);
  if (!companyId) {
    return NextResponse.json({ error: "Kein Unternehmen" }, { status: 400 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body" }, { status: 400 });
  }

  const status = (body as { status?: string }).status;
  if (!status || !VALID_STATUSES.has(status as WhatsappMessageStatusDb)) {
    return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 });
  }

  const message = await updateWhatsappMessageStatus(
    supabase,
    companyId,
    id,
    status as WhatsappMessageStatusDb
  );

  if (!message) {
    return NextResponse.json({ error: "Nachricht nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ message });
}
