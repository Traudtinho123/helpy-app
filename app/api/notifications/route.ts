import { NextResponse } from "next/server";
import { resolveCompanyIdForUser } from "@/features/lead-scoring/services/lead-score-supabase";
import {
  insertNotification,
  listNotificationsForCompany,
} from "@/lib/notifications/notification-repository";
import type { NotificationPriority } from "@/lib/notifications/notification-types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const VALID_PRIORITIES: NotificationPriority[] = ["wichtig", "normal"];

function parseCreateBody(body: unknown, companyId: string) {
  if (!body || typeof body !== "object") return null;
  const parsed = body as Record<string, unknown>;

  const typ = typeof parsed.typ === "string" ? parsed.typ.trim() : "";
  const titel = typeof parsed.titel === "string" ? parsed.titel.trim() : "";
  if (!typ || !titel) return null;

  const prioritaet = VALID_PRIORITIES.includes(
    parsed.prioritaet as NotificationPriority
  )
    ? (parsed.prioritaet as NotificationPriority)
    : "normal";

  return {
    company_id: companyId,
    typ,
    titel,
    beschreibung:
      typeof parsed.beschreibung === "string"
        ? parsed.beschreibung.trim()
        : null,
    link: typeof parsed.link === "string" ? parsed.link.trim() : null,
    prioritaet,
  };
}

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ notifications: [] });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const companyId = await resolveCompanyIdForUser(user.id);
  if (!companyId) {
    return NextResponse.json({ notifications: [] });
  }

  const notifications = await listNotificationsForCompany(companyId, 50);
  return NextResponse.json({ notifications });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, mode: "offline" });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const companyId = await resolveCompanyIdForUser(user.id);
  if (!companyId) {
    return NextResponse.json({ error: "Keine Firma" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body" }, { status: 400 });
  }

  const input = parseCreateBody(body, companyId);
  if (!input) {
    return NextResponse.json(
      { error: "typ und titel sind Pflichtfelder." },
      { status: 400 }
    );
  }

  const record = await insertNotification(input);
  if (!record) {
    return NextResponse.json(
      { error: "Notification konnte nicht erstellt werden." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, notification: record });
}
