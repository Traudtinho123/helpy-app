import { NextResponse } from "next/server";
import { deleteArchivedVorgaengeOlderThanDays } from "@/lib/vorgaenge/vorgang-repository";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const days =
    typeof body === "object" &&
    body !== null &&
    typeof (body as { days?: unknown }).days === "number"
      ? Math.max(1, Math.floor((body as { days: number }).days))
      : 30;

  const deleted = await deleteArchivedVorgaengeOlderThanDays(
    context.companyId,
    days
  );

  return NextResponse.json({ ok: true, deleted });
}
