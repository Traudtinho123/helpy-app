import { NextResponse } from "next/server";
import { requireCanInviteTeamMembers } from "@/lib/auth/require-team-invite";
import { sendHelpyEmail } from "@/lib/email/helpy-mail";
import { isEmailAlreadyInCompany } from "@/lib/team/services/team-repository";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type InviteBody = {
  fullName?: string;
  email?: string;
  role?: "EMPLOYEE" | "ADMIN";
};

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "https://helpy-app.vercel.app";

export async function POST(request: Request) {
  const access = await requireCanInviteTeamMembers();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let body: InviteBody;
  try {
    body = (await request.json()) as InviteBody;
  } catch {
    return NextResponse.json({ error: "Ungültiger Body." }, { status: 400 });
  }

  const fullName = body.fullName?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const role = body.role === "ADMIN" ? "ADMIN" : "EMPLOYEE";

  if (!fullName || !email) {
    return NextResponse.json(
      { error: "Bitte Name und E-Mail ausfüllen." },
      { status: 400 }
    );
  }

  if (await isEmailAlreadyInCompany(access.companyId, email)) {
    return NextResponse.json(
      { error: "Diese E-Mail ist bereits im Team vorhanden." },
      { status: 409 }
    );
  }

  if (!isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    await sendHelpyEmail({
      to: email,
      subject: `Einladung zu ${access.companyName} bei HELPY`,
      text: [
        `Hallo ${fullName},`,
        "",
        `Du wurdest zu ${access.companyName} bei HELPY eingeladen.`,
        "",
        `→ Jetzt registrieren: ${APP_URL}/registrieren`,
        "",
        "Nach der Registrierung kannst du dich mit deinem Konto anmelden.",
      ].join("\n"),
    });
    return NextResponse.json({ ok: true, dev: true });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Server-Konfiguration fehlt." },
      { status: 503 }
    );
  }

  const nameParts = fullName.split(/\s+/);
  const vorname = nameParts[0] ?? fullName;
  const nachname = nameParts.slice(1).join(" ");

  const invitedRole = role === "ADMIN" ? "admin" : "member";

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${APP_URL}/auth/callback`,
    data: {
      vorname,
      nachname,
      invited_company_id: access.companyId,
      invited_role: invitedRole,
      firma: access.companyName,
    },
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("already") || message.includes("registered")) {
      return NextResponse.json(
        {
          error:
            "Diese E-Mail ist bereits registriert. Bitte den Nutzer direkt zum Team hinzufügen.",
        },
        { status: 409 }
      );
    }
    console.error("[team/invite]", error.message);
    return NextResponse.json(
      { error: "Einladung konnte nicht versendet werden." },
      { status: 500 }
    );
  }

  await sendHelpyEmail({
    to: email,
    subject: `Einladung zu ${access.companyName} bei HELPY`,
    text: [
      `Hallo ${fullName},`,
      "",
      `Du wurdest zu ${access.companyName} bei HELPY eingeladen.`,
      "",
      `→ Einladung annehmen: ${APP_URL}`,
      "",
      "Falls du keine E-Mail von Supabase erhalten hast, melde dich beim Admin.",
    ].join("\n"),
  });

  return NextResponse.json({
    ok: true,
    invitedUserId: data.user?.id ?? null,
  });
}
