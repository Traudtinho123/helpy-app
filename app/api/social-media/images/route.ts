import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export async function POST(request: Request) {
  const auth = await requireCompanyContext();
  const context = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ungültiger Upload." }, { status: 400 });
  }

  const objektId = String(form.get("objekt_id") ?? "manual").trim() || "manual";
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Datei fehlt." }, { status: 400 });
  }

  if (
    !ALLOWED_TYPES.has(file.type) &&
    !file.type.startsWith("image/")
  ) {
    return NextResponse.json(
      { error: "Nur JPG- oder PNG-Bilder sind erlaubt." },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Datei ist zu gross (max. 10 MB)." },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${context.companyId}/${objektId}/${Date.now()}-${safeName}`;

  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    const base64 = bytes.toString("base64");
    const mime = file.type || "image/jpeg";
    return NextResponse.json({
      url: `data:${mime};base64,${base64}`,
      path: `dev://${path}`,
      storage: "local-fallback",
      message:
        "Supabase Storage nicht konfiguriert — Bild lokal als Data-URL gespeichert.",
    });
  }

  const admin = createAdminClient();
  const supabase = admin ?? (await createClient());
  if (!supabase) {
    return NextResponse.json(
      { error: "Storage-Client nicht verfügbar." },
      { status: 500 }
    );
  }

  const { error } = await supabase.storage
    .from("social-media-images")
    .upload(path, bytes, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

  if (error) {
    console.error("[social-media-images] upload failed:", error.message);
    return NextResponse.json(
      { error: `Upload fehlgeschlagen: ${error.message}` },
      { status: 500 }
    );
  }

  const { data } = supabase.storage.from("social-media-images").getPublicUrl(path);

  return NextResponse.json({
    url: data.publicUrl,
    path,
    storage: "supabase",
  });
}
