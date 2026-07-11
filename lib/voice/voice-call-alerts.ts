import type { VoiceCallClassification } from "@/features/voice/types/voice-types";
import { sendGmailMessage } from "@/features/gmail/services/gmail-drafts";
import type { HelpyCompanyRoleDb } from "@/lib/database/types";
import { getValidGoogleTokensForUser } from "@/lib/oauth/token-service";
import { createAdminClient } from "@/lib/supabase/admin";

const ADMIN_ROLES: HelpyCompanyRoleDb[] = ["admin", "owner"];

const GMAIL_ALERT_CLASSIFICATIONS: VoiceCallClassification[] = [
  "notfall",
  "rueckruf_wunsch",
];

type CompanyAdminContact = {
  userId: string;
  email: string;
  role: HelpyCompanyRoleDb;
};

async function resolveUserEmail(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string
): Promise<string | null> {
  const { data: userData, error } = await admin.auth.admin.getUserById(userId);
  if (error || !userData.user?.email?.trim()) return null;
  return userData.user.email.trim();
}

async function loadCompanyAdminContacts(companyId: string): Promise<CompanyAdminContact[]> {
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

  const contacts: CompanyAdminContact[] = [];

  for (const profile of sorted) {
    const email = await resolveUserEmail(admin, profile.id);
    if (!email || contacts.some((item) => item.email === email)) continue;
    contacts.push({
      userId: profile.id,
      email,
      role: profile.role as HelpyCompanyRoleDb,
    });
  }

  return contacts;
}

function buildAlertSubject(
  classification: VoiceCallClassification,
  companyName: string
): string {
  if (classification === "notfall") {
    return `🚨 HELPY Phone Notfall — ${companyName}`;
  }
  return `☎ HELPY Phone Rückrufwunsch — ${companyName}`;
}

function buildAlertBody(input: {
  classification: VoiceCallClassification;
  companyName: string;
  callerPhone: string | null;
  summary: string;
  transcript: string;
}): string {
  const headline =
    input.classification === "notfall"
      ? "NOTFALL — HELPY Phone"
      : "RÜCKRUFWUNSCH — HELPY Phone";

  const intro =
    input.classification === "notfall"
      ? "Ein Anrufer hat ein dringendes Anliegen gemeldet. Bitte umgehend reagieren."
      : "Ein Anrufer möchte zurückgerufen werden.";

  return [
    headline,
    "",
    intro,
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
}

async function sendVoiceAdminGmailAlert(input: {
  companyId: string;
  companyName: string;
  callerPhone: string | null;
  classification: VoiceCallClassification;
  summary: string;
  transcript: string;
}): Promise<boolean> {
  const admins = await loadCompanyAdminContacts(input.companyId);
  if (admins.length === 0) return false;

  const primaryAdmin = admins[0];
  const google = await getValidGoogleTokensForUser(
    input.companyId,
    primaryAdmin.userId,
    primaryAdmin.email
  );

  if (!google?.tokens.accessToken) return false;

  const subject = buildAlertSubject(input.classification, input.companyName);
  const body = buildAlertBody(input);

  let sent = false;

  for (const admin of admins) {
    const result = await sendGmailMessage({
      accessToken: google.tokens.accessToken,
      to: admin.email,
      subject,
      body,
    });

    if (result.ok) {
      sent = true;
    } else {
      console.error("[voice] gmail alert failed:", {
        to: admin.email,
        error: result.error,
      });
    }
  }

  return sent;
}

/**
 * Serverseitige Voice-Benachrichtigung nach Gesprächsende.
 * Primär: Vorgang mit Priorität HOCH (processed_payload → Client-Sync + Push).
 * Optional: Gmail an Unternehmens-Admin, wenn OAuth verbunden ist.
 */
export async function dispatchVoiceCallAlert(input: {
  companyId: string;
  companyName: string;
  callerPhone: string | null;
  classification: VoiceCallClassification;
  summary: string;
  transcript: string;
}): Promise<void> {
  if (!GMAIL_ALERT_CLASSIFICATIONS.includes(input.classification)) return;

  const emailed = await sendVoiceAdminGmailAlert(input);

  console.log("[voice] call alert", {
    companyId: input.companyId,
    classification: input.classification,
    gmailSent: emailed,
    fallback: emailed ? undefined : "vorgang_hoch_prioritaet_client_push",
  });
}
