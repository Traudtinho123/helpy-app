import { NextResponse } from "next/server";
import { computeLeadScoreRecords } from "@/features/lead-scoring/services/lead-score-refresh";
import { upsertLeadScoresInDatabase } from "@/features/lead-scoring/services/lead-score-supabase";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const url = new URL(request.url);
  return url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}

async function handleCron(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY fehlt" },
      { status: 503 }
    );
  }

  const { data: companies, error } = await admin
    .from("companies")
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  let updatedTotal = 0;

  for (const company of companies ?? []) {
    const { data: kunden } = await admin
      .from("kunden")
      .select("id, email, erstellt_am")
      .eq("company_id", company.id);

    if (!kunden?.length) continue;

    const records = computeLeadScoreRecords(
      kunden.map((row) => ({
        id: row.id,
        email: row.email ?? "",
        lastActivity: row.erstellt_am,
      })),
      now
    );

    updatedTotal += await upsertLeadScoresInDatabase(
      company.id,
      records,
      admin
    );
  }

  return NextResponse.json({
    ok: true,
    companies: companies?.length ?? 0,
    updated: updatedTotal,
    note: "Server-Cron nutzt DB-Kunden; Client berechnet Scores aus Live-Vorgängen.",
  });
}
