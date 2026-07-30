import { NextResponse } from "next/server";
import {
  markDealProvisionPaid,
  updateDealPhase,
  updateDealProvision,
} from "@/lib/deals/deal-repository";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type RouteContext = { params: Promise<{ dealId: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { dealId } = await params;

  let body: {
    phase?: number;
    beschreibung?: string;
    typ?: "phase_wechsel" | "auto_erkannt";
    provision_prozent?: number | null;
    provision_chf?: number | null;
    provision_mwst_prozent?: number | null;
    verkaufspreis_chf?: number | null;
    mark_paid?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  if (body.mark_paid) {
    const deal = await markDealProvisionPaid({
      dealId,
      companyId: context.companyId,
    });
    if (!deal) {
      return NextResponse.json({ error: "Deal nicht gefunden." }, { status: 404 });
    }
    return NextResponse.json({ deal });
  }

  const hasProvisionUpdate =
    body.provision_prozent !== undefined ||
    body.provision_chf !== undefined ||
    body.provision_mwst_prozent !== undefined ||
    body.verkaufspreis_chf !== undefined;

  if (hasProvisionUpdate) {
    const deal = await updateDealProvision({
      dealId,
      companyId: context.companyId,
      provision_prozent: body.provision_prozent,
      provision_chf: body.provision_chf,
      provision_mwst_prozent: body.provision_mwst_prozent,
      verkaufspreis_chf: body.verkaufspreis_chf,
    });
    if (!deal) {
      return NextResponse.json({ error: "Deal nicht gefunden." }, { status: 404 });
    }
    return NextResponse.json({ deal });
  }

  if (!body.phase || body.phase < 1 || body.phase > 9) {
    return NextResponse.json({ error: "phase 1–9 erforderlich." }, { status: 400 });
  }

  const deal = await updateDealPhase({
    dealId,
    companyId: context.companyId,
    userId: context.userId,
    phase: body.phase,
    typ: body.typ,
    beschreibung: body.beschreibung,
  });

  if (!deal) {
    return NextResponse.json({ error: "Deal nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json({ deal });
}
