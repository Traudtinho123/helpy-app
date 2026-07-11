import type { VoiceCallClassification } from "@/features/voice/types/voice-types";
import type { HelpyCompanyRoleDb } from "@/lib/database/types";
import { createAdminClient } from "@/lib/supabase/admin";

function getResendConfig(): { apiKey: string; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

const ADMIN_ROLES: HelpyCompanyRoleDb[] = ["admin", "owner"];

async function resolveUserEmail(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string
): Promise<string | null> {
  const { data: userData, error } = await admin.auth.admin.getUserById(userId);
  if (error || !userData.user?.email?.trim()) return null;
  return userData.user.email.trim();
}

/** E-Mails der Unternehmens-Admins (role admin oder owner). */
async function loadCompanyAdminEmails(companyId: string): Promise<string[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("profiles")
    .select("id, role")
    .eq("company_id", companyId)
    .in("role", ADMIN_ROLES)
    .order("erstellt_am", { ascending: true });

  if (error || !data?.length) {
    console.error("[voice] admin profiles load failed:", error?.message ?? "none found");
    return [];
  }

  const sorted = [...data].sort((a, b) => {
    const rank = (role: string) => (role === "admin" ? 0 : role === "owner" ? 1 : 2);
    return rank(a.role) - rank(b.role);
  });

  const emails: string[] = [];

  for (const profile of sorted) {
    const email = await resolveUserEmail(admin, profile.id);
    if (email && !emails.includes(email)) {
      emails.push(email);
    }
  }

  return emails;
}

async function sendResendEmail(input: {
  to: string[];
  subject: string;
  text: string;
}): Promise<boolean> {
  const config = getResendConfig();
  if (!config || input.to.length === 0) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.from,
        to: input.to,
        subject: input.subject,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("[voice] resend alert failed:", response.status, body.slice(0, 200));
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "[voice] resend alert error:",
      error instanceof Error ? error.message : "unknown"
    );
    return false;
  }
}

export async function dispatchVoiceCallAlert(input: {
  companyId: string;
  companyName: string;
  callerPhone: string | null;
  classification: VoiceCallClassification;
  summary: string;
  transcript: string;
}): Promise<void> {
  if (input.classification !== "notfall") return;

  const recipients = await loadCompanyAdminEmails(input.companyId);

  if (recipients.length === 0) {
    console.error("[voice] notfall alert skipped — no admin/owner email for company", {
      companyId: input.companyId,
    });
    return;
  }

  const subject = `🚨 HELPY Phone Notfall — ${input.companyName}`;
  const text = [
    "NOTFALL — HELPY Phone",
    "",
    "Ein Anrufer hat ein dringendes Anliegen gemeldet. Bitte umgehend reagieren.",
    "",
    `Unternehmen: ${input.companyName}`,
    `Anrufer: ${input.callerPhone ?? "Unbekannt"}`,
    "",
    "Zusammenfassung:",
    input.summary,
    "",
    "Transkript (Auszug):",
    input.transcript.slice(0, 1200),
    "",
    "→ Vorgang in HELPY prüfen und Anrufer zurückrufen.",
  ].join("\n");

  const emailed = await sendResendEmail({
    to: recipients,
    subject,
    text,
  });

  console.log("[voice] notfall alert", {
    companyId: input.companyId,
    adminRecipients: recipients,
    emailed,
  });
}
