import { NextResponse } from "next/server";
import { dispatchWeeklyReports } from "@/features/weekly-report/services/weekly-report-dispatch";
import { isWeeklyReportMailConfigured } from "@/features/weekly-report/services/weekly-report-sender";
import {
  DEFAULT_ANALYTICS_TIMEZONE,
  isWeeklyReportSendWindow,
} from "@/lib/datetime/timezone-week";

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

  if (!isWeeklyReportMailConfigured()) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_SERVICE_ROLE_KEY und HELPY_OAUTH_ENCRYPTION_KEY werden für Gmail-Versand benötigt.",
      },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "true";
  const now = new Date();

  if (!force && !isWeeklyReportSendWindow(now, DEFAULT_ANALYTICS_TIMEZONE)) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Außerhalb des Versandfensters (Mo 05:30–05:44 Europe/Zurich).",
      now: now.toISOString(),
    });
  }

  try {
    const result = await dispatchWeeklyReports({ now, force });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Wochenbericht fehlgeschlagen.";
    console.error("[cron/weekly-report]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
