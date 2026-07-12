import { NextResponse } from "next/server";
import {
  createDevVoiceContext,
  requireVoiceContext,
} from "@/lib/voice/require-voice-context";
import {
  deleteVoiceStandardResponse,
  listVoiceStandardResponses,
  upsertVoiceStandardResponse,
  VoiceStandardResponsesError,
} from "@/lib/voice/voice-standard-responses-repository";
import type { VoiceStandardResponseCategory } from "@/features/voice/types/voice-standard-response-types";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import {
  aiSettingsForbiddenResponse,
  requireCanEditAISettings,
} from "@/lib/auth/require-ai-settings";

const CATEGORIES: VoiceStandardResponseCategory[] = [
  "allgemein",
  "objekte",
  "termine",
  "preise",
];

function voiceErrorResponse(error: unknown, fallback: string) {
  const message =
    error instanceof VoiceStandardResponsesError
      ? error.message
      : error instanceof Error
        ? error.message
        : fallback;

  console.error("[voice/standard-responses]", message);
  return NextResponse.json({ error: message }, { status: 503 });
}

export async function GET() {
  const auth = await requireVoiceContext();
  const context = auth.ok ? auth.context : createDevVoiceContext();

  if (!auth.ok && isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const responses = await listVoiceStandardResponses(context.companyId);
    return NextResponse.json({ responses });
  } catch (error) {
    return voiceErrorResponse(error, "Standard-Antworten konnten nicht geladen werden.");
  }
}

export async function POST(request: Request) {
  const aiAuth = await requireCanEditAISettings();
  if (!aiAuth.ok) {
    return aiSettingsForbiddenResponse(aiAuth.error);
  }

  const auth = await requireVoiceContext();
  const context = auth.ok ? auth.context : createDevVoiceContext();

  if (!auth.ok && isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
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

    return NextResponse.json({ response, ok: true });
  } catch (error) {
    return voiceErrorResponse(error, "Speichern fehlgeschlagen.");
  }
}

export async function PATCH(request: Request) {
  const aiAuth = await requireCanEditAISettings();
  if (!aiAuth.ok) {
    return aiSettingsForbiddenResponse(aiAuth.error);
  }

  const auth = await requireVoiceContext();
  const context = auth.ok ? auth.context : createDevVoiceContext();

  if (!auth.ok && isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
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

    return NextResponse.json({ response, ok: true });
  } catch (error) {
    return voiceErrorResponse(error, "Aktualisieren fehlgeschlagen.");
  }
}

export async function DELETE(request: Request) {
  const aiAuth = await requireCanEditAISettings();
  if (!aiAuth.ok) {
    return aiSettingsForbiddenResponse(aiAuth.error);
  }

  const auth = await requireVoiceContext();
  const context = auth.ok ? auth.context : createDevVoiceContext();

  if (!auth.ok && isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id fehlt." }, { status: 400 });
    }

    await deleteVoiceStandardResponse(context.companyId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return voiceErrorResponse(error, "Löschen fehlgeschlagen.");
  }
}
