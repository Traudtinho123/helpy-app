import { NextResponse } from "next/server";
import {
  createDevVoiceContext,
  requireVoiceContext,
} from "@/lib/voice/require-voice-context";
import {
  deleteVoiceStandardResponse,
  listVoiceStandardResponses,
  upsertVoiceStandardResponse,
} from "@/lib/voice/voice-standard-responses-repository";
import type { VoiceStandardResponseCategory } from "@/features/voice/types/voice-standard-response-types";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

const CATEGORIES: VoiceStandardResponseCategory[] = [
  "allgemein",
  "objekte",
  "termine",
  "preise",
];

export async function GET() {
  const auth = await requireVoiceContext();
  const context = auth.ok ? auth.context : createDevVoiceContext();

  if (!auth.ok && isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const responses = await listVoiceStandardResponses(context.companyId);
  return NextResponse.json({ responses });
}

export async function POST(request: Request) {
  const auth = await requireVoiceContext();
  const context = auth.ok ? auth.context : createDevVoiceContext();

  if (!auth.ok && isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const category = CATEGORIES.includes(body.category as VoiceStandardResponseCategory)
    ? (body.category as VoiceStandardResponseCategory)
    : "allgemein";

  const response = await upsertVoiceStandardResponse(context.companyId, {
    triggerText: String(body.triggerText ?? ""),
    responseText: String(body.responseText ?? ""),
    category,
    enabled: body.enabled !== false,
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : undefined,
  });

  if (!response) {
    return NextResponse.json({ error: "Speichern fehlgeschlagen." }, { status: 503 });
  }

  return NextResponse.json({ response });
}

export async function PATCH(request: Request) {
  const auth = await requireVoiceContext();
  const context = auth.ok ? auth.context : createDevVoiceContext();

  if (!auth.ok && isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const id = typeof body.id === "string" ? body.id : null;
  if (!id) {
    return NextResponse.json({ error: "id fehlt." }, { status: 400 });
  }

  const category = CATEGORIES.includes(body.category as VoiceStandardResponseCategory)
    ? (body.category as VoiceStandardResponseCategory)
    : "allgemein";

  const response = await upsertVoiceStandardResponse(context.companyId, {
    id,
    triggerText: String(body.triggerText ?? ""),
    responseText: String(body.responseText ?? ""),
    category,
    enabled: body.enabled !== false,
    sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : undefined,
  });

  if (!response) {
    return NextResponse.json({ error: "Aktualisieren fehlgeschlagen." }, { status: 503 });
  }

  return NextResponse.json({ response });
}

export async function DELETE(request: Request) {
  const auth = await requireVoiceContext();
  const context = auth.ok ? auth.context : createDevVoiceContext();

  if (!auth.ok && isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id fehlt." }, { status: 400 });
  }

  const ok = await deleteVoiceStandardResponse(context.companyId, id);
  if (!ok) {
    return NextResponse.json({ error: "Löschen fehlgeschlagen." }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
