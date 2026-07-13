import { NextResponse } from "next/server";
import {
  activateCompanySkill,
  listPendingCompanies,
} from "@/lib/auth/permissions-repository";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { sendHelpyEmail } from "@/lib/email/helpy-mail";
import {
  buildActivationEmailHtml,
  buildActivationEmailText,
} from "@/lib/email/activation-email";
import { recordEmailNotification } from "@/lib/onboarding/onboarding-repository";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      companies: [],
      dev: true,
    });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isSuperAdmin(user.id))) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  const companies = await listPendingCompanies();
  return NextResponse.json({ companies });
}

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

  if (!user || !(await isSuperAdmin(user.id))) {
    return NextResponse.json({ error: "Kein Zugriff." }, { status: 403 });
  }

  let body: { companyId?: string; skill?: string; adminEmail?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  if (!body.companyId?.trim() || !body.skill?.trim()) {
    return NextResponse.json(
      { error: "companyId und skill sind Pflicht." },
      { status: 400 }
    );
  }

  const ok = await activateCompanySkill({
    companyId: body.companyId.trim(),
    skill: body.skill.trim(),
    activatedBy: user.id,
  });

  if (!ok) {
    return NextResponse.json(
      { error: "Freischaltung fehlgeschlagen." },
      { status: 500 }
    );
  }

  if (body.adminEmail?.trim()) {
    const appOrigin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
      "https://helpy-app.vercel.app";
    const onboardingUrl = `${appOrigin}/onboarding/schritt-1`;

    await sendHelpyEmail({
      to: body.adminEmail.trim(),
      subject: "HELPY ist bereit – leg los! 🚀",
      text: buildActivationEmailText({
        firstName: "du",
        onboardingUrl,
      }),
      html: buildActivationEmailHtml({
        firstName: "du",
        onboardingUrl,
      }),
    });

    await recordEmailNotification({
      companyId: body.companyId.trim(),
      type: "activation",
      recipient: body.adminEmail.trim(),
    });
  }

  return NextResponse.json({ ok: true });
}
