import { NextResponse } from "next/server";
import { clearOutlookTokensFromCookies } from "@/features/outlook/services/outlook-auth-server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireCompanyContext } from "@/lib/tenant/require-company-context";

export async function POST(): Promise<NextResponse> {
  const auth = await requireCompanyContext();
  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  await clearOutlookTokensFromCookies();
  return NextResponse.json({ ok: true });
}
