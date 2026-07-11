import { NextResponse } from "next/server";
import { upsertWhatsappConnection } from "@/features/whatsapp/services/whatsapp-repository";
import { resolveCompanyIdForUser } from "@/features/lead-scoring/services/lead-score-supabase";
import { getWhatsappEnv, isWhatsappConfigured } from "@/lib/whatsapp/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({
      configured: isWhatsappConfigured(),
      connected: false,
      displayNumber: null,
      phoneNumberId: null,
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const companyId = await resolveCompanyIdForUser(user.id);
  if (!companyId) {
    return NextResponse.json({
      configured: isWhatsappConfigured(),
      connected: false,
      displayNumber: null,
      phoneNumberId: null,
    });
  }

  const { data } = await supabase
    .from("whatsapp_connections")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  const env = getWhatsappEnv();

  return NextResponse.json({
    configured: isWhatsappConfigured(),
    connected: Boolean(data?.is_active),
    displayNumber: data?.display_number ?? null,
    phoneNumberId: data?.phone_number_id ?? env.phoneNumberId ?? null,
  });
}

export async function POST() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase nicht konfiguriert" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const companyId = await resolveCompanyIdForUser(user.id);
  if (!companyId) {
    return NextResponse.json({ error: "Kein Unternehmen" }, { status: 400 });
  }

  const env = getWhatsappEnv();
  if (!env.phoneNumberId) {
    return NextResponse.json(
      { error: "WHATSAPP_PHONE_NUMBER_ID fehlt in der Server-Konfiguration" },
      { status: 400 }
    );
  }

  const connection = await upsertWhatsappConnection(supabase, {
    companyId,
    phoneNumberId: env.phoneNumberId,
    displayNumber: null,
  });

  if (!connection) {
    return NextResponse.json({ error: "Verbindung konnte nicht gespeichert werden" }, { status: 500 });
  }

  return NextResponse.json({ connection });
}
