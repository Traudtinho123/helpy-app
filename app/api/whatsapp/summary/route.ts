import { NextResponse } from "next/server";
import {
  buildWhatsappSummary,
  fetchWhatsappConnection,
} from "@/features/whatsapp/services/whatsapp-repository";
import { resolveCompanyIdForUser } from "@/features/lead-scoring/services/lead-score-supabase";
import { isWhatsappConfigured } from "@/lib/whatsapp/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({
      openCount: 0,
      neuCount: 0,
      inBearbeitungCount: 0,
      erledigtCount: 0,
      archiviertCount: 0,
      todayCount: 0,
      weekCount: 0,
      connected: false,
      displayNumber: null,
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const companyId = await resolveCompanyIdForUser(user.id);
  if (!companyId) {
    return NextResponse.json({
      openCount: 0,
      neuCount: 0,
      inBearbeitungCount: 0,
      erledigtCount: 0,
      archiviertCount: 0,
      todayCount: 0,
      weekCount: 0,
      connected: false,
      displayNumber: null,
    });
  }

  const summary = await buildWhatsappSummary(supabase, companyId);
  const connection = await fetchWhatsappConnection(supabase, companyId);

  return NextResponse.json({
    ...summary,
    connected: Boolean(connection?.isActive) || isWhatsappConfigured(),
    displayNumber: connection?.displayNumber ?? summary.displayNumber,
  });
}
