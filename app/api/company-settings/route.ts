import { NextResponse } from "next/server";
import { companyRowToProfile } from "@/lib/company/company-profile-mapper";
import {
  fetchCompanyProfileRow,
  upsertCompanyProfileRow,
} from "@/lib/company/company-profile-repository";
import type { CompanyProfile } from "@/lib/company/company-profile-types";
import {
  requireCanEditAISettings,
  aiSettingsForbiddenResponse,
} from "@/lib/auth/require-ai-settings";
import { requireOAuthContext } from "@/lib/oauth/require-oauth-context";
import { createClient } from "@/lib/supabase/server";

function parseProfileBody(body: unknown, companyId: string): CompanyProfile | null {
  if (!body || typeof body !== "object") return null;
  const parsed = body as Partial<CompanyProfile>;
  if (typeof parsed.companyName !== "string" || !parsed.companyName.trim()) {
    return null;
  }

  return {
    ...(parsed as CompanyProfile),
    companyId,
    companyName: parsed.companyName.trim(),
  };
}

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
    const row = await fetchCompanyProfileRow(supabase, auth.context.companyId);
    if (!row) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({
      profile: companyRowToProfile(row),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Firmendaten konnten nicht geladen werden.";
    console.error("[company-settings] GET failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const editAuth = await requireCanEditAISettings();
  if (!editAuth.ok) {
    return aiSettingsForbiddenResponse(editAuth.error);
  }

  const auth = await requireOAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (auth.context.companyId !== editAuth.companyId) {
    return NextResponse.json(
      { error: "Unternehmen stimmt nicht überein." },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase ist nicht konfiguriert." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const parsed = parseProfileBody(body, auth.context.companyId);
  if (!parsed) {
    return NextResponse.json({ error: "Firmenname fehlt." }, { status: 400 });
  }

  try {
    const row = await upsertCompanyProfileRow(supabase, parsed);
    return NextResponse.json({
      profile: companyRowToProfile(row),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Firmendaten konnten nicht gespeichert werden.";
    console.error("[company-settings] PUT failed:", message);

    if (/column .* does not exist/i.test(message)) {
      return NextResponse.json(
        {
          error:
            "Datenbank-Migration fehlt. Bitte supabase/migrations/20260714120000_companies_profile_fields.sql ausführen.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
