import { NextResponse } from "next/server";
import { requireCanInviteTeamMembers } from "@/lib/auth/require-team-invite";
import { sendHelpyEmail } from "@/lib/email/helpy-mail";
import {
  createAuthInviteLink,
  createTeamInvite,
  findPendingInviteByEmail,
  buildTeamInviteEmail,
  teamInviteRowToMember,
} from "@/lib/team/services/team-invite-repository";
import { isEmailAlreadyInCompany } from "@/lib/team/services/team-repository";

type InviteBody = {
  fullName?: string;
  email?: string;
  role?: "EMPLOYEE" | "ADMIN";
};

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

  const existingInvite = await findPendingInviteByEmail(access.companyId, email);
  if (existingInvite) {
    return NextResponse.json(
      { error: "Für diese E-Mail liegt bereits eine offene Einladung vor." },
      { status: 409 }
    );
  }

  const storedInvite = await createTeamInvite({
    companyId: access.companyId,
    email,
    fullName,
    role,
    invitedBy: access.userId,
  });

  if (!storedInvite.ok) {
    return NextResponse.json({ error: storedInvite.error }, { status: 500 });
  }

  const authLink = await createAuthInviteLink({
    email,
    fullName,
    companyId: access.companyId,
    companyName: access.companyName,
    role,
  });

  const loginLink = authLink.link;

  const mail = buildTeamInviteEmail({
    fullName,
    email,
    companyName: access.companyName,
    loginLink,
  });

  const mailSent = await sendHelpyEmail({
    to: email,
    subject: mail.subject,
    text: mail.text,
  });

  if (!mailSent) {
    return NextResponse.json(
      {
        error:
          "Einladung gespeichert, aber E-Mail-Versand fehlgeschlagen. Bitte RESEND_API_KEY prüfen.",
      },
      { status: 502 }
    );
  }

  const member = teamInviteRowToMember(storedInvite.invite);

  return NextResponse.json({
    ok: true,
    member,
  });
}
