import { buildWeeklyReport } from "@/features/weekly-report/services/weekly-report-builder";
import { sendWeeklyReportEmail } from "@/features/weekly-report/services/weekly-report-sender";
import { getIsoWeekKeyInTimezone, getPreviousWeekRangeInTimezone, DEFAULT_ANALYTICS_TIMEZONE } from "@/lib/datetime/timezone-week";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export type WeeklyReportRecipient = {
  userId: string;
  email: string;
  companyId: string;
  companyName: string;
  recipientName: string | null;
  weeklyReportEnabled: boolean;
  lastSentWeek: string | null;
};

export type DispatchWeeklyReportsOptions = {
  now?: Date;
  force?: boolean;
  userId?: string;
  dryRun?: boolean;
  /** Gmail Access Token aus Login-Session (nur Debug/Test) */
  sessionAccessToken?: string | null;
};

export type DispatchWeeklyReportsResult = {
  attempted: number;
  sent: number;
  skipped: number;
  failed: number;
  details: Array<{
    userId: string;
    email: string;
    status: "sent" | "skipped" | "failed";
    reason?: string;
  }>;
};

function resolveRecipientName(profile: {
  vorname: string | null;
  nachname: string | null;
}): string | null {
  const parts = [profile.vorname, profile.nachname].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

export async function fetchWeeklyReportRecipients(
  admin: SupabaseClient,
  userId?: string
): Promise<WeeklyReportRecipient[]> {
  let query = admin
    .from("profiles")
    .select(
      "id, vorname, nachname, company_id, weekly_report_enabled, weekly_report_last_sent_week"
    )
    .eq("weekly_report_enabled", true)
    .not("company_id", "is", null);

  if (userId) {
    query = query.eq("id", userId);
  }

  const { data: profiles, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const companyIds = [
    ...new Set((profiles ?? []).map((p) => p.company_id).filter(Boolean)),
  ] as string[];

  const companyNames = new Map<string, string>();
  if (companyIds.length > 0) {
    const { data: companies } = await admin
      .from("companies")
      .select("id, name")
      .in("id", companyIds);

    for (const company of companies ?? []) {
      companyNames.set(company.id, company.name);
    }
  }

  const recipients: WeeklyReportRecipient[] = [];

  for (const profile of profiles ?? []) {
    if (!profile.company_id) continue;

    const { data: userData, error: userError } =
      await admin.auth.admin.getUserById(profile.id);

    if (userError || !userData.user?.email) continue;

    recipients.push({
      userId: profile.id,
      email: userData.user.email,
      companyId: profile.company_id,
      companyName: companyNames.get(profile.company_id) ?? "Dein Unternehmen",
      recipientName: resolveRecipientName(profile),
      weeklyReportEnabled: profile.weekly_report_enabled,
      lastSentWeek: profile.weekly_report_last_sent_week,
    });
  }

  return recipients;
}

export async function dispatchWeeklyReports(
  options: DispatchWeeklyReportsOptions = {}
): Promise<DispatchWeeklyReportsResult> {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY fehlt — Versand nicht möglich.");
  }

  const now = options.now ?? new Date();
  const timeZone = DEFAULT_ANALYTICS_TIMEZONE;
  const { start: reportWeekStart } = getPreviousWeekRangeInTimezone(now, timeZone);
  const targetWeekKey = getIsoWeekKeyInTimezone(reportWeekStart, timeZone);

  const recipients = await fetchWeeklyReportRecipients(admin, options.userId);
  const result: DispatchWeeklyReportsResult = {
    attempted: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  for (const recipient of recipients) {
    result.attempted += 1;

    if (!options.force && recipient.lastSentWeek === targetWeekKey) {
      result.skipped += 1;
      result.details.push({
        userId: recipient.userId,
        email: recipient.email,
        status: "skipped",
        reason: `Bereits versendet für ${targetWeekKey}`,
      });
      continue;
    }

    try {
      const report = await buildWeeklyReport(admin, {
        companyId: recipient.companyId,
        companyName: recipient.companyName,
        recipientName: recipient.recipientName,
        now,
        timeZone,
      });

      if (options.dryRun) {
        result.skipped += 1;
        result.details.push({
          userId: recipient.userId,
          email: recipient.email,
          status: "skipped",
          reason: "Dry run",
        });
        continue;
      }

      const sendResult = await sendWeeklyReportEmail({
        userId: recipient.userId,
        companyId: recipient.companyId,
        loginEmail: recipient.email,
        data: report,
        sessionAccessToken: options.sessionAccessToken,
      });

      if (!sendResult.ok) {
        result.failed += 1;
        result.details.push({
          userId: recipient.userId,
          email: recipient.email,
          status: "failed",
          reason: sendResult.error,
        });
        continue;
      }

      const { error: updateError } = await admin
        .from("profiles")
        .update({ weekly_report_last_sent_week: targetWeekKey })
        .eq("id", recipient.userId);

      if (updateError) {
        console.error(
          "[weekly-report] could not update last_sent_week:",
          updateError.message
        );
      }

      result.sent += 1;
      result.details.push({
        userId: recipient.userId,
        email: recipient.email,
        status: "sent",
      });
    } catch (error) {
      result.failed += 1;
      result.details.push({
        userId: recipient.userId,
        email: recipient.email,
        status: "failed",
        reason: error instanceof Error ? error.message : "Unbekannter Fehler",
      });
    }
  }

  return result;
}

/** Testversand für eingeloggten Nutzer — nutzt Session-Gmail-Token, kein Service Role. */
export async function dispatchWeeklyReportForSessionUser(input: {
  supabase: SupabaseClient;
  userId: string;
  companyId: string;
  email: string;
  sessionAccessToken: string;
  force?: boolean;
  dryRun?: boolean;
  now?: Date;
}): Promise<DispatchWeeklyReportsResult> {
  const now = input.now ?? new Date();
  const timeZone = DEFAULT_ANALYTICS_TIMEZONE;
  const { start: reportWeekStart } = getPreviousWeekRangeInTimezone(now, timeZone);
  const targetWeekKey = getIsoWeekKeyInTimezone(reportWeekStart, timeZone);

  const result: DispatchWeeklyReportsResult = {
    attempted: 1,
    sent: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  const { data: profile, error: profileError } = await input.supabase
    .from("profiles")
    .select(
      "vorname, nachname, company_id, weekly_report_enabled, weekly_report_last_sent_week"
    )
    .eq("id", input.userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (profile?.weekly_report_enabled === false) {
    result.skipped = 1;
    result.details.push({
      userId: input.userId,
      email: input.email,
      status: "skipped",
      reason: "Wochenbericht in Einstellungen deaktiviert.",
    });
    return result;
  }

  if (!input.force && profile?.weekly_report_last_sent_week === targetWeekKey) {
    result.skipped = 1;
    result.details.push({
      userId: input.userId,
      email: input.email,
      status: "skipped",
      reason: `Bereits versendet für ${targetWeekKey}. Nutze force=true zum erneuten Test.`,
    });
    return result;
  }

  const { data: company } = await input.supabase
    .from("companies")
    .select("name")
    .eq("id", input.companyId)
    .maybeSingle();

  try {
    const report = await buildWeeklyReport(input.supabase, {
      companyId: input.companyId,
      companyName: company?.name ?? "Dein Unternehmen",
      recipientName: profile ? resolveRecipientName(profile) : null,
      now,
      timeZone,
    });

    if (input.dryRun) {
      result.skipped = 1;
      result.details.push({
        userId: input.userId,
        email: input.email,
        status: "skipped",
        reason: "Dry run",
      });
      return result;
    }

    const sendResult = await sendWeeklyReportEmail({
      userId: input.userId,
      companyId: input.companyId,
      loginEmail: input.email,
      data: report,
      sessionAccessToken: input.sessionAccessToken,
    });

    if (!sendResult.ok) {
      result.failed = 1;
      result.details.push({
        userId: input.userId,
        email: input.email,
        status: "failed",
        reason: sendResult.error,
      });
      return result;
    }

    await input.supabase
      .from("profiles")
      .update({ weekly_report_last_sent_week: targetWeekKey })
      .eq("id", input.userId);

    result.sent = 1;
    result.details.push({
      userId: input.userId,
      email: sendResult.fromEmail,
      status: "sent",
    });
  } catch (error) {
    result.failed = 1;
    result.details.push({
      userId: input.userId,
      email: input.email,
      status: "failed",
      reason: error instanceof Error ? error.message : "Unbekannter Fehler",
    });
  }

  return result;
}
