import { NextResponse } from "next/server";
import {
  detectDealPhaseFromMailContent,
  shouldAdvancePhase,
} from "@/features/deals/services/deal-phase-detector";
import {
  findDealByVorgangId,
  listDealsForCompany,
  updateDealPhase,
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

  let body: { vorgangId?: string; mailContent?: string; interessentName?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  if (!body.vorgangId?.trim() || !body.mailContent?.trim()) {
    return NextResponse.json(
      { error: "vorgangId und mailContent erforderlich." },
      { status: 400 }
    );
  }

  const deal =
    (await findDealByVorgangId(context.companyId, body.vorgangId.trim())) ??
    (await listDealsForCompany(context.companyId)).find(
      (item) => item.vorgang_id === body.vorgangId?.trim()
    );

  if (!deal) {
    return NextResponse.json({ updated: false, reason: "no_deal" });
  }

  const detection = detectDealPhaseFromMailContent(
    body.mailContent,
    deal.deal_type,
    body.interessentName ?? deal.kunde_name ?? "Interessent"
  );

  if (!detection || !shouldAdvancePhase(deal.phase, detection.phase)) {
    return NextResponse.json({ updated: false, reason: "no_phase_change" });
  }

  const updated = await updateDealPhase({
    dealId: deal.id,
    companyId: context.companyId,
    userId: context.userId,
    phase: detection.phase,
    typ: "auto_erkannt",
    beschreibung: detection.reason,
  });

  return NextResponse.json({
    updated: Boolean(updated),
    deal: updated,
    notification: detection.notificationTitle,
    phase: detection.phase,
  });
}
