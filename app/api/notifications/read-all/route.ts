import { NextResponse } from "next/server";
import { resolveCompanyIdForUser } from "@/features/lead-scoring/services/lead-score-supabase";
import { markAllNotificationsReadForCompany } from "@/lib/notifications/notification-repository";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
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

  const ok = await markAllNotificationsReadForCompany(companyId);
  if (!ok) {
    return NextResponse.json(
      { error: "Konnte nicht als gelesen markiert werden." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
