import type { VoiceCallClassification } from "@/features/voice/types/voice-types";
import { createAdminClient } from "@/lib/supabase/admin";

function getResendConfig(): { apiKey: string; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

async function loadCompanyMemberEmails(companyId: string): Promise<string[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("company_id", companyId);

  if (error || !data) return [];

  const emails: string[] = [];

  for (const profile of data) {
    const { data: userData, error: userError } = await admin.auth.admin.getUserById(
      profile.id
    );
    if (userError || !userData.user?.email) continue;
    emails.push(userData.user.email);
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
      console.error("[voice] resend alert failed:", response.status);
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

  const recipients = await loadCompanyMemberEmails(input.companyId);
  const subject = `HELPY Phone Notfall — ${input.companyName}`;
  const text = [
    "HELPY Phone: Dringender Anruf erkannt",
    "",
    `Unternehmen: ${input.companyName}`,
    `Anrufer: ${input.callerPhone ?? "Unbekannt"}`,
    `Zusammenfassung: ${input.summary}`,
    "",
    "Transkript (Auszug):",
    input.transcript.slice(0, 1200),
    "",
    "Bitte prüfen Sie den Vorgang in HELPY.",
  ].join("\n");

  const emailed = await sendResendEmail({
    to: recipients,
    subject,
    text,
  });

  console.log("[voice] notfall alert", {
    companyId: input.companyId,
    recipients: recipients.length,
    emailed,
  });
}
