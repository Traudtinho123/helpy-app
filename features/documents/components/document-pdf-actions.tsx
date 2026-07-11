"use client";

import { useCallback, useState } from "react";
import { Download, Loader2, Printer, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/Modal";
import {
  downloadProfessionalPdf,
  fetchProfessionalPdfBase64,
  printProfessionalPdf,
} from "@/features/documents/pdf/client-actions";
import type { ProfessionalDocumentPayload } from "@/features/documents/pdf/types";
import { sendGmailMessage } from "@/features/gmail/services/gmail-drafts";
import { createClient } from "@/lib/supabase/client";
import type { CompanyProfile } from "@/lib/company/company-profile-types";

type DocumentPdfActionsProps = {
  payload: ProfessionalDocumentPayload | null;
  branding: CompanyProfile;
  defaultRecipient?: string;
  defaultSubject?: string;
  className?: string;
  compact?: boolean;
};

async function getGoogleAccessToken(): Promise<string | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.provider_token ?? null;
}

export function DocumentPdfActions({
  payload,
  branding,
  defaultRecipient = "",
  defaultSubject,
  className,
  compact = false,
}: DocumentPdfActionsProps) {
  const [busy, setBusy] = useState<"download" | "print" | "send" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [subject, setSubject] = useState(
    defaultSubject ?? "Dokument von HELPY"
  );
  const [message, setMessage] = useState(
    "Anbei finden Sie das gewünschte Dokument als PDF."
  );
  const [sendFeedback, setSendFeedback] = useState<string | null>(null);

  const ensurePayload = useCallback(() => {
    if (!payload) {
      setError("Für dieses Dokument ist noch keine PDF-Vorlage hinterlegt.");
      return false;
    }
    return true;
  }, [payload]);

  const handleDownload = useCallback(async () => {
    if (!ensurePayload() || !payload) return;
    setBusy("download");
    setError(null);
    try {
      await downloadProfessionalPdf({ payload, branding });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download fehlgeschlagen.");
    } finally {
      setBusy(null);
    }
  }, [branding, ensurePayload, payload]);

  const handlePrint = useCallback(async () => {
    if (!ensurePayload() || !payload) return;
    setBusy("print");
    setError(null);
    try {
      await printProfessionalPdf({ payload, branding });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Druck fehlgeschlagen.");
    } finally {
      setBusy(null);
    }
  }, [branding, ensurePayload, payload]);

  const handleSend = useCallback(async () => {
    if (!ensurePayload() || !payload) return;
    if (!recipient.trim()) {
      setError("Bitte Empfänger-E-Mail angeben.");
      return;
    }

    setBusy("send");
    setError(null);
    setSendFeedback(null);

    try {
      const accessToken = await getGoogleAccessToken();
      if (!accessToken) {
        throw new Error(
          "Nicht mit Gmail verbunden. Bitte Google-Konto verbinden und erneut versuchen."
        );
      }

      const pdf = await fetchProfessionalPdfBase64({ payload, branding });
      const result = await sendGmailMessage({
        accessToken,
        to: recipient.trim(),
        subject: subject.trim() || "Dokument",
        body: message.trim() || "Anbei das Dokument.",
        attachments: [
          {
            filename: pdf.fileName,
            mimeType: pdf.mimeType,
            contentBase64: pdf.base64,
          },
        ],
      });

      if (!result.ok) {
        throw new Error(result.error);
      }

      setSendFeedback("Dokument per Gmail gesendet.");
      setForwardOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Senden fehlgeschlagen.");
    } finally {
      setBusy(null);
    }
  }, [branding, ensurePayload, message, payload, recipient, subject]);

  const buttonClass = compact
    ? "h-9 gap-2 rounded-[10px] border-[#CBD5E1]/60 text-[12px] font-medium"
    : "h-9 gap-2 rounded-[10px] border-[#CBD5E1]/60 text-[12px] font-medium";

  return (
    <>
      <div className={className}>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className={buttonClass}
            disabled={!payload || busy !== null}
            onClick={() => void handleDownload()}
          >
            {busy === "download" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Herunterladen
          </Button>
          <Button
            type="button"
            variant="outline"
            className={buttonClass}
            disabled={!payload || busy !== null}
            onClick={() => void handlePrint()}
          >
            {busy === "print" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Printer className="size-4" />
            )}
            Drucken
          </Button>
          <Button
            type="button"
            className="h-9 gap-2 rounded-[10px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[12px] font-semibold text-white shadow-sm"
            disabled={!payload || busy !== null}
            onClick={() => {
              setError(null);
              setForwardOpen(true);
            }}
          >
            <Send className="size-4" />
            Weitersenden
          </Button>
        </div>
        {error ? (
          <p className="mt-2 text-[11px] text-[#DC2626]">{error}</p>
        ) : null}
        {sendFeedback ? (
          <p className="mt-2 text-[11px] text-[#047857]">{sendFeedback}</p>
        ) : null}
        {!payload ? (
          <p className="mt-2 text-[11px] text-[#94A3B8]">
            PDF-Export ist für diesen Dokumenttyp noch nicht verfügbar.
          </p>
        ) : null}
      </div>

      <Modal
        open={forwardOpen}
        onClose={() => setForwardOpen(false)}
        title="Dokument weitersenden"
        description="PDF wird als Anhang über Gmail versendet."
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#64748B]">
              Empfänger
            </label>
            <Input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="name@firma.de"
              className="h-10 rounded-[12px]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#64748B]">
              Betreff
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-10 rounded-[12px]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[#64748B]">
              Nachricht
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full rounded-[12px] border border-[#CBD5E1]/60 bg-white px-3 py-2 text-[13px] text-[#0F172A] outline-none focus-visible:border-[#2563EB] focus-visible:ring-3 focus-visible:ring-[#2563EB]/20"
            />
          </div>
          {error ? (
            <p className="text-[11px] text-[#DC2626]">{error}</p>
          ) : null}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => setForwardOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              disabled={busy === "send"}
              onClick={() => void handleSend()}
            >
              {busy === "send" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Per Gmail senden
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
