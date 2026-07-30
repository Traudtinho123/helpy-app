import { NextResponse } from "next/server";
import { listDealsForCompany } from "@/lib/deals/deal-repository";
import { provisionsToCsv } from "@/lib/finanzen/rechnung-repository";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET() {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const deals = await listDealsForCompany(context.companyId);
  const rows = deals
    .filter((deal) => deal.provision_chf != null && deal.provision_chf > 0)
    .map((deal) => ({
      objekt_title: null,
      objekt_id: deal.objekt_id,
      kunde_name: deal.kunde_name,
      abschluss_datum: deal.phase >= 9 ? deal.phase_updated_at : null,
      verkaufspreis_chf: deal.verkaufspreis_chf,
      provision_prozent: deal.provision_prozent,
      provision_chf: deal.provision_chf,
      provision_status: deal.provision_status,
      provision_rechnung_nr: deal.provision_rechnung_nr,
    }));

  const csv = provisionsToCsv(rows);
  const fileName = `provisions-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
