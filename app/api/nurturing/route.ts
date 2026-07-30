import { NextResponse } from "next/server";
import { prepareNurturingMailsForCompany } from "@/features/nurturing/services/nurturing-prepare-service";
import {
  computeNurturingRoi,
  listNurturingMailsForCompany,
  listPreparedNurturingMails,
} from "@/lib/nurturing/nurturing-repository";
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
  const status = url.searchParams.get("status");
  const includeStats = url.searchParams.get("stats") === "1";
  const prepare = url.searchParams.get("prepare") === "1";

  if (prepare) {
    await prepareNurturingMailsForCompany({
      companyId: context.companyId,
      origin: url.origin,
      force: true,
    });
  }

  const prepared = await listPreparedNurturingMails(context.companyId);
  const all = includeStats
    ? await listNurturingMailsForCompany(context.companyId)
    : prepared;

  return NextResponse.json({
    mails: status === "vorbereitet" || !status ? prepared : all,
    preparedCount: prepared.length,
    stats: includeStats ? computeNurturingRoi(all) : undefined,
  });
}

export async function POST(request: Request) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  let body: { force?: boolean } = {};
  try {
    body = (await request.json()) as { force?: boolean };
  } catch {
    body = {};
  }

  const result = await prepareNurturingMailsForCompany({
    companyId: context.companyId,
    origin: url.origin,
    force: body.force === true,
  });

  const prepared = await listPreparedNurturingMails(context.companyId);

  return NextResponse.json({
    created: result.created.length,
    preparedCount: prepared.length,
    mails: prepared,
  });
}
