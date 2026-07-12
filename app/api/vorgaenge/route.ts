import { NextResponse } from "next/server";
import { mapVorgangDbRecordToBundle } from "@/features/vorgaenge/services/vorgang-db-mapper";
import type {
  CreateVorgangInput,
  CreateVorgangPriority,
  CreateVorgangStatus,
  VorgangSource,
} from "@/features/vorgaenge/types/create-vorgang-types";
import { createVorgang } from "@/lib/vorgaenge/create-vorgang";
import { listVorgaengeForCompany } from "@/lib/vorgaenge/vorgang-repository";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const VALID_SOURCES: VorgangSource[] = [
  "gmail",
  "immoscout",
  "homegate",
  "helpy_phone",
  "whatsapp",
  "manuell",
];

const VALID_PRIORITIES: CreateVorgangPriority[] = [
  "kritisch",
  "hoch",
  "normal",
  "niedrig",
];

const VALID_STATUSES: CreateVorgangStatus[] = [
  "neu",
  "in_bearbeitung",
  "warten_auf_antwort",
];

function parseCreateInput(
  body: unknown,
  companyId: string
): CreateVorgangInput | null {
  if (!body || typeof body !== "object") return null;
  const parsed = body as Partial<CreateVorgangInput>;

  if (!parsed.titel?.trim() || !parsed.inhalt?.trim()) return null;
  if (!parsed.source || !VALID_SOURCES.includes(parsed.source)) return null;

  const prioritaet = VALID_PRIORITIES.includes(
    parsed.prioritaet as CreateVorgangPriority
  )
    ? (parsed.prioritaet as CreateVorgangPriority)
    : "normal";

  const status = VALID_STATUSES.includes(parsed.status as CreateVorgangStatus)
    ? (parsed.status as CreateVorgangStatus)
    : "neu";

  return {
    company_id: companyId,
    source: parsed.source,
    titel: parsed.titel.trim(),
    inhalt: parsed.inhalt.trim(),
    prioritaet,
    status,
    kunden_id: parsed.kunden_id?.trim() || null,
    objekt_id: parsed.objekt_id?.trim() || null,
    gmail_message_id: parsed.gmail_message_id?.trim() || null,
    gmail_thread_id: parsed.gmail_thread_id?.trim() || null,
    voice_call_id: parsed.voice_call_id?.trim() || null,
    anrufer_nummer: parsed.anrufer_nummer?.trim() || null,
    termin_datum: parsed.termin_datum?.trim() || null,
    termin_uhrzeit: parsed.termin_uhrzeit?.trim() || null,
    whatsapp_message_id: parsed.whatsapp_message_id?.trim() || null,
  };
}

export async function GET() {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const records = await listVorgaengeForCompany(context.companyId, 200);
  const vorgaenge = records.map((record) => ({
    ...mapVorgangDbRecordToBundle(record),
    record,
  }));

  return NextResponse.json({ vorgaenge });
}

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

  const input = parseCreateInput(body, context.companyId);
  if (!input) {
    return NextResponse.json(
      { error: "titel, inhalt und source sind Pflichtfelder." },
      { status: 400 }
    );
  }

  try {
    const result = await createVorgang(input);
    const bundle = mapVorgangDbRecordToBundle(result.record);

    return NextResponse.json({
      ok: true,
      id: result.id,
      created: result.created,
      record: result.record,
      liste: bundle.liste,
      workspace: bundle.workspace,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Vorgang konnte nicht erstellt werden.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
