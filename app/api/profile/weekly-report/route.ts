import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOAuthContext } from "@/lib/oauth/require-oauth-context";

export async function GET() {
  const auth = await requireOAuthContext();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ enabled: true });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("weekly_report_enabled")
    .eq("id", auth.context.userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    enabled: data?.weekly_report_enabled ?? true,
  });
}

export async function PATCH(request: Request) {
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

  let body: { enabled?: unknown };
  try {
    body = (await request.json()) as { enabled?: unknown };
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json(
      { error: "Feld enabled (boolean) erforderlich." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("profiles")
    .update({ weekly_report_enabled: body.enabled })
    .eq("id", auth.context.userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ enabled: body.enabled });
}
