import { NextResponse } from "next/server";
import {
  computeProvisionKpis,
  type ProvisionRow,
} from "@/features/finanzen/types/finanzen-types";
import { listDealsForCompany } from "@/lib/deals/deal-repository";
import { getMonatszielForCompany } from "@/lib/finanzen/monatsziel-store";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const monatszielParam = url.searchParams.get("monatsziel");
  const monatsziel =
    monatszielParam != null
      ? Math.max(0, Number(monatszielParam) || 0)
      : getMonatszielForCompany(context.companyId);

  const deals = await listDealsForCompany(context.companyId);
  const provisions: ProvisionRow[] = deals
    .filter((deal) => deal.provision_chf != null && deal.provision_chf > 0)
    .map((deal) => ({
      ...deal,
      objekt_title: null,
      abschluss_datum:
        deal.phase >= 9 ? deal.phase_updated_at : null,
    }));

  const kpis = computeProvisionKpis(provisions, monatsziel);

  return NextResponse.json({ provisions, kpis, monatsziel });
}
