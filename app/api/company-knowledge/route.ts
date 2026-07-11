import { NextResponse } from "next/server";
import { validateCompanyKnowledge } from "@/features/company-knowledge/services/company-knowledge-validator";
import type { CompanyKnowledge } from "@/features/company-knowledge/types/company-knowledge-types";
import {
  fetchCompanyKnowledgeRow,
  rowToCompanyKnowledge,
  upsertCompanyKnowledgeRow,
} from "@/features/company-knowledge/services/company-knowledge-repository";
import { requireOAuthContext } from "@/lib/oauth/require-oauth-context";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await requireOAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase ist nicht konfiguriert." },
      { status: 503 }
    );
  }

  try {
    const row = await fetchCompanyKnowledgeRow(supabase, auth.context.companyId);
    if (!row) {
      return NextResponse.json({ knowledge: null });
    }

    return NextResponse.json({
      knowledge: rowToCompanyKnowledge(row),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Firmenwissen konnte nicht geladen werden.";
    console.error("[company-knowledge] GET failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireOAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase ist nicht konfiguriert." },
      { status: 503 }
    );
  }

  let body: { knowledge?: unknown };
  try {
    body = (await request.json()) as { knowledge?: unknown };
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  if (!body.knowledge || typeof body.knowledge !== "object" || Array.isArray(body.knowledge)) {
    return NextResponse.json({ error: "Feld knowledge fehlt." }, { status: 400 });
  }

  const candidate = {
    ...(body.knowledge as Record<string, unknown>),
    companyId: auth.context.companyId,
  } as CompanyKnowledge;

  const validation = validateCompanyKnowledge(candidate);
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.errors.join(" ") },
      { status: 400 }
    );
  }

  try {
    const row = await upsertCompanyKnowledgeRow(
      supabase,
      auth.context.companyId,
      auth.context.userId,
      candidate
    );

    return NextResponse.json({
      knowledge: rowToCompanyKnowledge(row),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Firmenwissen konnte nicht gespeichert werden.";
    console.error("[company-knowledge] PUT failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
