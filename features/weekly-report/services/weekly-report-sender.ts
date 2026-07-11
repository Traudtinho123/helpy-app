import {
  GMAIL_SEND_ERROR_MESSAGE,
  sendGmailMessage,
} from "@/features/gmail/services/gmail-drafts";
import {
  buildWeeklyReportHtml,
  buildWeeklyReportSubject,
  buildWeeklyReportText,
} from "@/features/weekly-report/services/weekly-report-html";
import type { WeeklyReportData } from "@/features/weekly-report/types/weekly-report-types";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { getValidGoogleTokensForUser } from "@/lib/oauth/token-service";
import { SUPABASE_URL } from "@/lib/supabase/config";

export type SendWeeklyReportResult =
  | { ok: true; messageId: string; fromEmail: string }
  | { ok: false; error: string };

export type SendWeeklyReportInput = {
  userId: string;
  companyId: string;
  loginEmail?: string | null;
  data: WeeklyReportData;
  /** Optional: Session-Token für manuellen Test ohne oauth_connections-Zeile */
  sessionAccessToken?: string | null;
};

export function isWeeklyReportMailConfigured(): boolean {
  return (
    isSupabaseAdminConfigured() &&
    Boolean(process.env.HELPY_OAUTH_ENCRYPTION_KEY?.trim())
  );
}

/** Cron braucht OAuth-Speicher; Debug mit Google-Login reicht Session-Token. */
export function isWeeklyReportDebugConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim())
  );
}

export async function sendWeeklyReportEmail(
  input: SendWeeklyReportInput
): Promise<SendWeeklyReportResult> {
  const google = await getValidGoogleTokensForUser(
    input.companyId,
    input.userId,
    input.loginEmail
  );

  const accessToken =
    google?.tokens.accessToken ?? input.sessionAccessToken ?? null;

  if (!accessToken) {
    return {
      ok: false,
      error:
        "Keine verbundene Gmail-Adresse gefunden. Bitte Gmail unter Plattformen verbinden.",
    };
  }

  const recipientEmail = google?.tokens.accountEmail ?? input.loginEmail;
  if (!recipientEmail?.trim()) {
    return {
      ok: false,
      error: "Empfänger-Adresse für den Wochenbericht konnte nicht ermittelt werden.",
    };
  }

  const subject = buildWeeklyReportSubject(input.data);
  const html = buildWeeklyReportHtml(input.data);
  const text = buildWeeklyReportText(input.data);

  const result = await sendGmailMessage({
    accessToken,
    to: recipientEmail,
    subject,
    body: text,
    html,
  });

  if (!result.ok) {
    return {
      ok: false,
      error: result.error || GMAIL_SEND_ERROR_MESSAGE,
    };
  }

  return {
    ok: true,
    messageId: result.messageId,
    fromEmail: google?.tokens.accountEmail ?? recipientEmail,
  };
}
