import { NextResponse } from "next/server";
import { buildWorkdayAnalytics } from "@/features/analytics/services/workday-analytics";
import {
  fetchCompanyKnowledgeRow,
  parseCompanyKnowledgeData,
} from "@/features/company-knowledge/services/company-knowledge-repository";
import { DEFAULT_ANALYTICS_TIMEZONE } from "@/lib/datetime/timezone-week";
import { requireOAuthContext } from "@/lib/oauth/require-oauth-context";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

function parseHour(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const match = value.match(/^(\d{1,2})/);
  if (!match) return fallback;
  const hour = Number(match[1]);
  return Number.isFinite(hour) ? Math.min(23, Math.max(0, hour)) : fallback;
}

export async function GET() {
  const auth = await requireOAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase ist nicht konfiguriert." }, { status: 503 });
  }

  try {
    let workHoursStart = 8;
    let workHoursEnd = 20;

    const knowledgeRow = await fetchCompanyKnowledgeRow(supabase, auth.context.companyId);
    if (knowledgeRow) {
      const knowledge = parseCompanyKnowledgeData(
        knowledgeRow.data,
        auth.context.companyId
      );
      workHoursStart = parseHour(knowledge.businessHours.monday.start, workHoursStart);
      const endHour = parseHour(knowledge.businessHours.monday.end, workHoursEnd);
      workHoursEnd = Math.max(workHoursStart + 1, endHour);
    }

    const analytics = await buildWorkdayAnalytics(supabase, auth.context.companyId, {
      timeZone: DEFAULT_ANALYTICS_TIMEZONE,
      workHoursStart,
      workHoursEnd,
    });

    return NextResponse.json(analytics, {
      headers: {
        "Cache-Control": "private, max-age=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Analytics konnten nicht geladen werden.";
    console.error("[workday-analytics] GET failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
