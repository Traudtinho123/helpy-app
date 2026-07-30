import { NextResponse } from "next/server";
import { sendGmailMessage } from "@/features/gmail/services/gmail-drafts";
import {
  getNurturingMailById,
  listPreparedNurturingMails,
  markNurturingMailSent,
  touchKundeLetzterKontakt,
  updateNurturingMailContent,
} from "@/lib/nurturing/nurturing-repository";
import {
  createDevCompanyContext,
  requireCompanyContext,
} from "@/lib/tenant/require-company-context";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function getGmailAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.provider_token ?? null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ mailId: string }> }
) {
  const auth = await requireCompanyContext();
  const company = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { mailId } = await context.params;
  const body = (await request.json()) as {
    subject?: string;
    body_text?: string;
    body_html?: string;
  };

  if (!body.subject?.trim() || !body.body_text?.trim()) {
    return NextResponse.json(
      { error: "Betreff und Text sind erforderlich." },
      { status: 400 }
    );
  }

  const updated = await updateNurturingMailContent({
    companyId: company.companyId,
    mailId,
    subject: body.subject.trim(),
    body_text: body.body_text.trim(),
    body_html: body.body_html ?? null,
  });

  if (!updated) {
    return NextResponse.json(
      { error: "Mail nicht gefunden oder bereits gesendet." },
      { status: 404 }
    );
  }

  return NextResponse.json({ mail: updated });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ mailId: string }> }
) {
  const auth = await requireCompanyContext();
  const company = auth.ok ? auth.context : createDevCompanyContext();

  if (!auth.ok && isSupabaseConfigured()) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { mailId } = await context.params;
  let body: { action?: string; sendAll?: boolean } = {};
  try {
    body = (await request.json()) as { action?: string; sendAll?: boolean };
  } catch {
    body = {};
  }

  const accessToken = await getGmailAccessToken();
  if (!accessToken && isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Gmail-Zugriff fehlt. Bitte erneut mit Google anmelden und Mail-Berechtigung erteilen.",
      },
      { status: 401 }
    );
  }

  if (body.sendAll || mailId === "all") {
    const prepared = await listPreparedNurturingMails(company.companyId);
    const results: { id: string; ok: boolean; error?: string }[] = [];

    for (const mail of prepared) {
      const sendResult = accessToken
        ? await sendGmailMessage({
            accessToken,
            to: mail.to_email,
            subject: mail.subject,
            body: mail.body_text,
            html: mail.body_html ?? undefined,
          })
        : { ok: true as const, messageId: `dev-${mail.id}` };

      if (!sendResult.ok) {
        results.push({ id: mail.id, ok: false, error: sendResult.error });
        continue;
      }

      await markNurturingMailSent({
        companyId: company.companyId,
        mailId: mail.id,
        gmailMessageId: sendResult.messageId,
        gmailThreadId: null,
      });
      await touchKundeLetzterKontakt({
        companyId: company.companyId,
        kundeId: mail.kunde_id,
      });
      results.push({ id: mail.id, ok: true });
    }

    return NextResponse.json({
      sent: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    });
  }

  const mail = await getNurturingMailById(company.companyId, mailId);
  if (!mail || mail.status !== "vorbereitet") {
    return NextResponse.json(
      { error: "Mail nicht gefunden oder bereits gesendet." },
      { status: 404 }
    );
  }

  const sendResult = accessToken
    ? await sendGmailMessage({
        accessToken,
        to: mail.to_email,
        subject: mail.subject,
        body: mail.body_text,
        html: mail.body_html ?? undefined,
      })
    : { ok: true as const, messageId: `dev-${mail.id}` };

  if (!sendResult.ok) {
    return NextResponse.json({ error: sendResult.error }, { status: 502 });
  }

  const updated = await markNurturingMailSent({
    companyId: company.companyId,
    mailId: mail.id,
    gmailMessageId: sendResult.messageId,
    gmailThreadId: null,
  });

  await touchKundeLetzterKontakt({
    companyId: company.companyId,
    kundeId: mail.kunde_id,
  });

  return NextResponse.json({ mail: updated, sent: true });
}
