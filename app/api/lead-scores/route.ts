import { NextResponse } from "next/server";
import type { LeadScoreRecord } from "@/features/lead-scoring/types/lead-scoring-types";
import {
  fetchLeadScoresFromDatabase,
  resolveCompanyIdForUser,
  upsertLeadScoresInDatabase,
} from "@/features/lead-scoring/services/lead-score-supabase";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function parseRecords(body: unknown): LeadScoreRecord[] | null {
  if (!body || typeof body !== "object") return null;
  const records = (body as { records?: unknown }).records;
  if (!Array.isArray(records) || records.length === 0) return null;

  const parsed: LeadScoreRecord[] = [];
  for (const item of records.slice(0, 200)) {
    if (!item || typeof item !== "object") return null;
    const record = item as Partial<LeadScoreRecord>;
    if (
      typeof record.customerKey !== "string" ||
      typeof record.score !== "number" ||
      record.score < 1 ||
      record.score > 10 ||
      typeof record.updatedAt !== "string"
    ) {
      return null;
    }
    parsed.push({
      customerKey: record.customerKey,
      email: typeof record.email === "string" ? record.email : null,
      score: Math.round(record.score),
      updatedAt: record.updatedAt,
    });
  }

  return parsed;
}

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ records: [] });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const companyId = await resolveCompanyIdForUser(user.id);
  if (!companyId) {
    return NextResponse.json({ records: [] });
  }

  const records = await fetchLeadScoresFromDatabase(companyId);
  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, updated: 0, mode: "offline" });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const companyId = await resolveCompanyIdForUser(user.id);
  if (!companyId) {
    return NextResponse.json({ ok: true, updated: 0, mode: "no-company" });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body" }, { status: 400 });
  }

  const records = parseRecords(body);
  if (!records) {
    return NextResponse.json({ error: "Ungültige Score-Daten" }, { status: 400 });
  }

  const updated = await upsertLeadScoresInDatabase(companyId, records);

  return NextResponse.json({ ok: true, updated });
}
