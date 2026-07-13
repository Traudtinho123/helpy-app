import { NextResponse } from "next/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";

type TerminPatchBody = {
  termin_slots?: unknown;
  termin_bestaetigt?: string | null;
  termin_kalender_id?: string | null;
  termin_ics_url?: string | null;
  status?: string;
  termin_datum?: string | null;
  termin_uhrzeit?: string | null;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ vorgangId: string }> }
) {
  const auth = await requireCompanyContext();
  const companyContext = auth.ok ? auth.context : createDevCompanyContext();
  const { vorgangId } = await context.params;

  let body: TerminPatchBody;
  try {
    body = (await request.json()) as TerminPatchBody;
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: true, dev: true });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Datenbank nicht verfügbar." }, { status: 503 });
  }

  const patch: {
    updated_at: string;
    termin_slots?: unknown;
    termin_bestaetigt?: string | null;
    termin_kalender_id?: string | null;
    termin_ics_url?: string | null;
    status?: string;
    termin_datum?: string | null;
    termin_uhrzeit?: string | null;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (body.termin_slots !== undefined) patch.termin_slots = body.termin_slots;
  if (body.termin_bestaetigt !== undefined) {
    patch.termin_bestaetigt = body.termin_bestaetigt;
  }
  if (body.termin_kalender_id !== undefined) {
    patch.termin_kalender_id = body.termin_kalender_id;
  }
  if (body.termin_ics_url !== undefined) patch.termin_ics_url = body.termin_ics_url;
  if (body.status !== undefined) patch.status = body.status;
  if (body.termin_datum !== undefined) patch.termin_datum = body.termin_datum;
  if (body.termin_uhrzeit !== undefined) patch.termin_uhrzeit = body.termin_uhrzeit;

  const { error } = await admin
    .from("vorgaenge")
    // Neue Termin-Spalten — Typen nach SQL-Migration in Supabase generieren
    .update(patch as never)
    .eq("id", vorgangId)
    .eq("company_id", companyContext.companyId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
