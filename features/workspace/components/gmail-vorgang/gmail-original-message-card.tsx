"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { SectionCard } from "@/features/workspace/components/workspace-sections";
import { isPlatformRealEstateQuelle } from "@/features/brain/services/platform-email-detector";
import { extractEmailAddress } from "@/features/gmail/services/extract-email-address";
import { useWorkspaceContext } from "@/features/workspace/context";

type GmailMessagePayload = {
  from?: string;
  to?: string;
  subject?: string;
  date?: string;
  body?: string;
};

function formatMailDate(value: string): string {
  if (!value) return "—";
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Intl.DateTimeFormat("de-CH", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(parsed));
}

function MailMetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-[12px] leading-snug">
      <span className="w-14 shrink-0 font-medium text-[var(--text-muted)]">{label}</span>
      <span className="min-w-0 break-all text-[var(--text-primary)]">{value || "—"}</span>
    </div>
  );
}

export function GmailOriginalMessageCard() {
  const { mail } = useWorkspaceContext();
  const isPlatformInquiry = isPlatformRealEstateQuelle(mail.quelle);

  const [body, setBody] = useState(mail.inhalt || mail.snippet || "");
  const [meta, setMeta] = useState({
    from: mail.absender,
    to: mail.empfaenger ?? "",
    subject: mail.betreff,
    date: mail.datum,
  });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const absenderEmail =
    mail.absenderEmail ?? extractEmailAddress(mail.absender) ?? null;

  useEffect(() => {
    setBody(mail.inhalt || mail.snippet || "");
    setMeta({
      from: absenderEmail ?? mail.absender,
      to: mail.empfaenger ?? "",
      subject: mail.betreff,
      date: mail.datum,
    });
    setLoadError(null);

    if (!mail.gmailMessageId) return;

    const storedBody = (mail.inhalt || mail.snippet || "").trim();
    const looksLikeSummaryOnly =
      storedBody.length < 120 ||
      storedBody.includes("vermutlich eine Werbe-") ||
      storedBody.includes("hat vermutlich");

    if (!looksLikeSummaryOnly && storedBody.length > 200) return;

    let cancelled = false;
    setLoading(true);

    void fetch(`/api/mail/gmail/message/${encodeURIComponent(mail.gmailMessageId)}`)
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error ?? "Mail konnte nicht geladen werden.");
        }
        return response.json() as Promise<GmailMessagePayload>;
      })
      .then((payload) => {
        if (cancelled) return;
        if (payload.body?.trim()) {
          setBody(payload.body.trim());
        }
        setMeta({
          from:
            extractEmailAddress(payload.from ?? "") ??
            payload.from ??
            absenderEmail ??
            mail.absender,
          to: payload.to ?? mail.empfaenger ?? "",
          subject: payload.subject ?? mail.betreff,
          date: formatMailDate(payload.date ?? "") || mail.datum,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Mail konnte nicht geladen werden."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    absenderEmail,
    mail.absender,
    mail.betreff,
    mail.datum,
    mail.empfaenger,
    mail.gmailMessageId,
    mail.inhalt,
    mail.snippet,
  ]);

  return (
    <SectionCard
      title={isPlatformInquiry ? "Original-Anfrage" : "Original-Nachricht"}
      icon={Mail}
    >
      <div className="space-y-4">
        <div className="space-y-1.5 rounded-[14px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-3">
          <MailMetaRow label="Von" value={meta.from} />
          {meta.to ? <MailMetaRow label="An" value={meta.to} /> : null}
          <MailMetaRow label="Datum" value={meta.date} />
          <MailMetaRow label="Betreff" value={meta.subject} />
        </div>

        <div className="rounded-[14px] border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-3">
          {loading ? (
            <p className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
              <Loader2 className="size-3.5 animate-spin" />
              Original-Mail wird geladen …
            </p>
          ) : null}

          {loadError ? (
            <p className="mb-2 text-[11px] text-[#B45309]">{loadError}</p>
          ) : null}

          <p className="whitespace-pre-wrap text-[13px] leading-[1.7] text-[var(--text-primary)]">
            {body || "—"}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
