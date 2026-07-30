import { NextResponse } from "next/server";
import { computeDealPipelineAnalytics } from "@/features/deals/services/deal-analytics";
import type { CreateDealInput } from "@/features/deals/types/deal-types";
import {
  countOpenDeals,
  createDealRecord,
  listDealsForCompany,
} from "@/lib/deals/deal-repository";
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
  const objektId = url.searchParams.get("objekt_id")?.trim();
  const openOnly = url.searchParams.get("open_only") === "1";
  const countOnly = url.searchParams.get("count_only") === "1";

  if (countOnly) {
    const count = await countOpenDeals(context.companyId);
    return NextResponse.json({ count });
  }

  const deals = await listDealsForCompany(context.companyId, {
    objekt_id: objektId || undefined,
    openOnly,
  });

  const analytics = computeDealPipelineAnalytics(deals);

  return NextResponse.json({ deals, analytics });
}

export async function POST(request: Request) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: CreateDealInput;
  try {
    body = (await request.json()) as CreateDealInput;
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  if (!body.objekt_id?.trim()) {
    return NextResponse.json(
      { error: "objekt_id ist Pflicht." },
      { status: 400 }
    );
  }

  const deal = await createDealRecord(context.companyId, context.userId, {
    ...body,
    objekt_id: body.objekt_id.trim(),
  });

  if (!deal) {
    return NextResponse.json({ error: "Deal konnte nicht erstellt werden." }, { status: 500 });
  }

  return NextResponse.json({ deal });
}
