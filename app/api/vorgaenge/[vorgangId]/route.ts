import { NextResponse } from "next/server";
import {
  deleteVorgangRecord,
  updateVorgangRecord,
} from "@/lib/vorgaenge/vorgang-repository";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type RouteParams = { params: Promise<{ vorgangId: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { vorgangId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const parsed = body as {
    kunden_id?: string | null;
    objekt_id?: string | null;
    absender_name?: string | null;
    absender_email?: string | null;
    status?: string;
    archiv_kategorie?: string | null;
  };

  const updated = await updateVorgangRecord(vorgangId, context.companyId, parsed);
  if (!updated) {
    return NextResponse.json({ error: "Vorgang nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, vorgang: updated });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { vorgangId } = await params;
  const deleted = await deleteVorgangRecord(vorgangId, context.companyId);

  if (!deleted) {
    return NextResponse.json({ error: "Vorgang nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
