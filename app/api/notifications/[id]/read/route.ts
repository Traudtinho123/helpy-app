import { NextResponse } from "next/server";
import { resolveCompanyIdForUser } from "@/features/lead-scoring/services/lead-score-supabase";
import { markNotificationReadById } from "@/lib/notifications/notification-repository";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  const { id } = await context.params;

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
    return NextResponse.json({ error: "Keine Firma" }, { status: 403 });
  }

  const ok = await markNotificationReadById(companyId, id);
  if (!ok) {
    return NextResponse.json(
      { error: "Notification nicht gefunden." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
