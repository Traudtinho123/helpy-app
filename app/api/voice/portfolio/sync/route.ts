import { NextResponse } from "next/server";
import {
  createDevVoiceContext,
  requireVoiceContext,
} from "@/lib/voice/require-voice-context";
import {
  upsertVoicePortfolioSnapshot,
  type VoicePortfolioObject,
} from "@/lib/voice/voice-call-prompt-context";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";

function parseObjects(body: unknown): VoicePortfolioObject[] {
  if (!Array.isArray(body)) return [];

  return body
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const titel = typeof record.titel === "string" ? record.titel.trim() : "";
      if (!titel) return null;

      return {
        objectId:
          typeof record.objectId === "string" ? record.objectId : `obj-${titel}`,
        titel,
        adresse: typeof record.adresse === "string" ? record.adresse : "",
        ort: typeof record.ort === "string" ? record.ort : "",
        zimmer: typeof record.zimmer === "string" ? record.zimmer : null,
        preis: typeof record.preis === "string" ? record.preis : null,
        status:
          typeof record.status === "string" && record.status === "aktiv"
            ? "aktiv"
            : "aktiv",
      } satisfies VoicePortfolioObject;
    })
    .filter((item): item is VoicePortfolioObject => item !== null)
    .slice(0, 20);
}

/** Synchronisiert aktive Objekte für HELPY Phone (serverseitiger Prompt). */
export async function POST(request: Request) {
  const auth = await requireVoiceContext();
  const context = auth.ok ? auth.context : createDevVoiceContext();

  if (!auth.ok && isSupabaseAdminConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const objects = parseObjects(payload.objects);

  const ok = await upsertVoicePortfolioSnapshot(context.companyId, objects);
  if (!ok) {
    return NextResponse.json({ error: "Sync fehlgeschlagen." }, { status: 503 });
  }

  return NextResponse.json({ ok: true, count: objects.length });
}
