import { NextResponse } from "next/server";
import {
  dispatchWeeklyReportForSessionUser,
  dispatchWeeklyReports,
} from "@/features/weekly-report/services/weekly-report-dispatch";
import {
  isWeeklyReportDebugConfigured,
  isWeeklyReportMailConfigured,
} from "@/features/weekly-report/services/weekly-report-sender";
import { requireOAuthContext } from "@/lib/oauth/require-oauth-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function isAuthorizedDebug(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

/** Manueller Testversand — eingeloggter Nutzer oder CRON_SECRET. */
export async function POST(request: Request) {
  let userId: string | undefined;
  let companyId: string | undefined;
  let userEmail: string | null = null;
  let sessionAccessToken: string | null = null;
  const auth = await requireOAuthContext();

  if (auth.ok) {
    userId = auth.context.userId;
    companyId = auth.context.companyId;
    userEmail = auth.context.userEmail;
    const supabase = await createClient();
    if (supabase) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      sessionAccessToken = session?.provider_token ?? null;
    }
  } else if (!isAuthorizedDebug(request)) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const canSendViaSession = Boolean(
    auth.ok && sessionAccessToken && companyId && userEmail
  );

  if (!canSendViaSession && !isWeeklyReportMailConfigured()) {
    return NextResponse.json(
      {
        error:
          "Für Cron: SUPABASE_SERVICE_ROLE_KEY + HELPY_OAUTH_ENCRYPTION_KEY. Für Test: mit Google einloggen (Gmail-Session).",
      },
      { status: 503 }
    );
  }

  if (!isWeeklyReportDebugConfigured()) {
    return NextResponse.json(
      { error: "Supabase ist nicht konfiguriert." },
      { status: 503 }
    );
  }

  let dryRun = false;
  let force = true;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      dryRun?: boolean;
      force?: boolean;
      userId?: string;
    };
    dryRun = body.dryRun === true;
    if (body.force === false) force = false;
    if (!userId && body.userId && isAuthorizedDebug(request)) {
      userId = body.userId;
    }
  } catch {
    // optional body
  }

  try {
    if (canSendViaSession && userId && companyId && userEmail && sessionAccessToken) {
      const supabase = await createClient();
      if (!supabase) {
        return NextResponse.json(
          { error: "Supabase-Session nicht verfügbar." },
          { status: 503 }
        );
      }

      const result = await dispatchWeeklyReportForSessionUser({
        supabase,
        userId,
        companyId,
        email: userEmail,
        sessionAccessToken,
        force,
        dryRun,
      });

      return NextResponse.json({ ok: true, mode: "session", ...result });
    }

    const result = await dispatchWeeklyReports({
      userId,
      force,
      dryRun,
      sessionAccessToken,
    });

    return NextResponse.json({ ok: true, mode: "cron", ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Testversand fehlgeschlagen.";
    console.error("[debug/send-weekly-report]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
