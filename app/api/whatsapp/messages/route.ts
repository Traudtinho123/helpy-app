import { NextResponse } from "next/server";
import { fetchWhatsappMessages } from "@/features/whatsapp/services/whatsapp-repository";
import type { WhatsappMessageFilter } from "@/features/whatsapp/types/whatsapp-types";
import { resolveCompanyIdForUser } from "@/features/lead-scoring/services/lead-score-supabase";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const VALID_FILTERS = new Set<WhatsappMessageFilter>([
  "alle",
  "neu",
  "in_bearbeitung",
  "erledigt",
  "archiviert",
]);

export async function GET(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ messages: [] });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const companyId = await resolveCompanyIdForUser(user.id);
  if (!companyId) {
    return NextResponse.json({ messages: [] });
  }

  const { searchParams } = new URL(request.url);
  const filterParam = searchParams.get("filter") ?? "alle";
  const filter = VALID_FILTERS.has(filterParam as WhatsappMessageFilter)
    ? (filterParam as WhatsappMessageFilter)
    : "alle";

  const messages = await fetchWhatsappMessages(supabase, companyId, filter);
  return NextResponse.json({ messages });
}
