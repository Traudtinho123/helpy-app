import { NextResponse } from "next/server";
import { kundeRecordToCustomer } from "@/features/customers/services/kunden-mapper";
import type { CreateKundeInput } from "@/features/customers/types/kunden-db-types";
import {
  createKundeRecord,
  findKundeByPhone,
  listKundenForCompany,
} from "@/lib/kunden/kunden-repository";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function parseCreateInput(body: unknown): CreateKundeInput | null {
  if (!body || typeof body !== "object") return null;
  const parsed = body as Partial<CreateKundeInput>;
  if (!parsed.vorname?.trim() || !parsed.nachname?.trim()) return null;
  return {
    vorname: parsed.vorname.trim(),
    nachname: parsed.nachname.trim(),
    firma: parsed.firma?.trim() || null,
    email: parsed.email?.trim() || null,
    telefon: parsed.telefon?.trim() || null,
    adresse: parsed.adresse?.trim() || null,
    notizen: parsed.notizen?.trim() || null,
    status:
      parsed.status === "aktiv" || parsed.status === "bestandskunde"
        ? parsed.status
        : "interessent",
  };
}

export async function GET(request: Request) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const phone = url.searchParams.get("phone")?.trim();

  if (phone) {
    const match = await findKundeByPhone(context.companyId, phone);
    return NextResponse.json({
      customer: match ? kundeRecordToCustomer(match) : null,
    });
  }

  const records = await listKundenForCompany(context.companyId);
  return NextResponse.json({
    customers: records.map(kundeRecordToCustomer),
  });
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

  const input = parseCreateInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "Vorname und Nachname sind Pflichtfelder." },
      { status: 400 }
    );
  }

  const result = await createKundeRecord(context, input);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        duplicate: result.duplicate ?? null,
      },
      { status: result.duplicate ? 409 : 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    customer: kundeRecordToCustomer(result.record),
  });
}
