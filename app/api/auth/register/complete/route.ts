import { NextResponse } from "next/server";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import {
  SUPER_ADMIN_NOTIFY_EMAIL,
  sendHelpyEmail,
} from "@/lib/email/helpy-mail";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const VALID_SKILLS = [
  "real-estate",
  "construction",
  "consulting-legal",
  "friseur",
  "other",
] as const;

type RegisterBody = {
  companyName?: string;
  skill?: string;
  industry?: string;
  vorname?: string;
  nachname?: string;
  email?: string;
  telefon?: string;
};

const SKILL_LABELS: Record<string, string> = {
  "real-estate": "Immobilien (HELPY Real Estate)",
  construction: "Handwerk/Bau (HELPY Construction)",
  "consulting-legal": "Beratung/Recht (HELPY Consulting)",
  friseur: "Beauty/Wellness (HELPY Friseur)",
  other: "Anderes",
};

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, dev: true });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  const companyName = body.companyName?.trim();
  const skill = body.skill?.trim();
  const vorname = body.vorname?.trim() ?? "";
  const nachname = body.nachname?.trim() ?? "";

  if (!companyName || !skill || !VALID_SKILLS.includes(skill as (typeof VALID_SKILLS)[number])) {
    return NextResponse.json(
      { error: "Firmenname und Branche sind Pflichtfelder." },
      { status: 400 }
    );
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: true, dev: true });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Server-Konfiguration fehlt." }, { status: 503 });
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.company_id) {
    return NextResponse.json({ error: "Profil ohne Firma." }, { status: 400 });
  }

  const mappedSkill = skill === "other" || skill === "friseur" ? skill : skill;

  await admin
    .from("profiles")
    .update({
      vorname: vorname || null,
      nachname: nachname || null,
      telefon: body.telefon?.trim() || null,
      firma: companyName,
      role: "admin",
      allowed_skills: [],
    })
    .eq("id", user.id);

  await admin
    .from("companies")
    .update({
      name: companyName,
      industry: body.industry?.trim() || null,
      requested_skill: mappedSkill,
      registration_status: "pending",
    })
    .eq("id", profile.company_id);

  await admin.from("user_roles").upsert(
    {
      user_id: user.id,
      company_id: profile.company_id,
      role: "admin",
    },
    { onConflict: "user_id,company_id" }
  );

  await admin.from("company_skills").upsert(
    {
      company_id: profile.company_id,
      skill: mappedSkill === "other" ? "real-estate" : mappedSkill,
      is_active: false,
    },
    { onConflict: "company_id,skill" }
  );

  const userEmail = body.email?.trim() || user.email || "";
  const skillLabel = SKILL_LABELS[mappedSkill] ?? mappedSkill;

  await sendHelpyEmail({
    to: userEmail,
    subject: "Danke für deine HELPY-Registrierung",
    text:
      "Danke für deine Registrierung!\n\n" +
      "Wir schalten deinen Zugang innerhalb von 24h frei und melden uns bei dir.",
  });

  await sendHelpyEmail({
    to: SUPER_ADMIN_NOTIFY_EMAIL,
    subject: `Neue Registrierung: ${vorname} ${nachname} · ${companyName}`,
    text:
      `Neue Registrierung:\n` +
      `Name: ${vorname} ${nachname}\n` +
      `Firma: ${companyName}\n` +
      `Branche: ${body.industry?.trim() || skillLabel}\n` +
      `E-Mail: ${userEmail}\n` +
      `→ Jetzt freischalten: https://helpy-app.vercel.app/einstellungen/admin`,
  });

  return NextResponse.json({ ok: true });
}
