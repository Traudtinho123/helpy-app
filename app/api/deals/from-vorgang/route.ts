import { NextResponse } from "next/server";
import {
  createDealRecord,
  findDealByVorgangId,
} from "@/lib/deals/deal-repository";
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

  let body: {
    vorgangId?: string;
    objektId?: string;
    kundeId?: string | null;
    dealType?: "verkauf" | "vermietung";
    provisionChf?: number | null;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  if (!body.vorgangId?.trim() || !body.objektId?.trim()) {
    return NextResponse.json(
      { error: "vorgangId und objektId sind Pflicht." },
      { status: 400 }
    );
  }

  const existing = await findDealByVorgangId(
    context.companyId,
    body.vorgangId.trim()
  );
  if (existing) {
    return NextResponse.json({ deal: existing, existing: true });
  }

  const deal = await createDealRecord(context.companyId, context.userId, {
    objekt_id: body.objektId.trim(),
    vorgang_id: body.vorgangId.trim(),
    kunde_id: body.kundeId ?? null,
    deal_type: body.dealType ?? "verkauf",
    phase: 1,
    provision_chf: body.provisionChf ?? null,
  });

  if (!deal) {
    return NextResponse.json(
      { error: "Deal konnte nicht erstellt werden." },
      { status: 500 }
    );
  }

  return NextResponse.json({ deal, existing: false });
}
