"use client";

import { useEffect } from "react";
import { Loader2, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  GMAIL_SEND_CONFIRM_BUTTON_LABEL,
  GMAIL_SEND_LOADING_MESSAGE,
  GMAIL_SEND_MODAL_HINT,
  GMAIL_SEND_MODAL_TITLE,
} from "@/features/gmail/services/gmail-drafts";
import { HELPY_BUTTON_ABBRECHEN } from "@/features/review/services/safety";

type GmailSendConfirmModalProps = {
  open: boolean;
  recipient: string;
  subject: string;
  body: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

function ReviewField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
        {label}
      </p>
      {multiline ? (
        <p className="mt-1.5 whitespace-pre-line rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC]/80 px-3.5 py-3 text-[12px] leading-relaxed text-[#334155]">
          {value}
        </p>
      ) : (
        <p className="mt-1 text-[13px] font-medium text-[#0F172A]">{value}</p>
      )}
    </div>
  );
}

export function GmailSendConfirmModal({
  open,
  recipient,
  subject,
  body,
  loading = false,
  error = null,
  onConfirm,
  onCancel,
}: GmailSendConfirmModalProps) {
  const handleSendClick = () => {
    void onConfirm();
  };
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };

    window.document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [loading, onCancel, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0F172A]/40 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gmail-send-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-[#CBD5E1]/50 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
      >
        <div className="flex items-start justify-between border-b border-[#CBD5E1]/40 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-[#2563EB]" strokeWidth={2} />
              <p
                id="gmail-send-title"
                className="text-[14px] font-semibold tracking-[-0.01em] text-[#0F172A]"
              >
                {GMAIL_SEND_MODAL_TITLE}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onCancel}
            disabled={loading}
            className="size-9 rounded-[10px] border-[#CBD5E1]/60"
            aria-label="Schließen"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="rounded-[14px] border border-[#FECACA]/50 bg-[#FEF2F2]/60 px-4 py-3.5">
            <p className="text-[12px] leading-relaxed text-[#334155]">
              {GMAIL_SEND_MODAL_HINT}
            </p>
          </div>

          <div className="mt-5 space-y-4">
            <ReviewField label="Empfänger" value={recipient} />
            <ReviewField label="Betreff" value={subject} />
            <ReviewField label="Inhalt" value={body} multiline />
          </div>

          {loading && (
            <p className="mt-4 rounded-[12px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/60 px-3.5 py-2.5 text-[11px] leading-relaxed text-[#2563EB]">
              <Loader2 className="mr-1.5 inline size-3 animate-spin" />
              {GMAIL_SEND_LOADING_MESSAGE}
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-[12px] border border-[#FECACA]/60 bg-[#FEF2F2]/70 px-3.5 py-2.5 text-[11px] leading-relaxed text-[#B91C1C]">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-[#CBD5E1]/40 bg-[#F8FAFC]/80 px-6 py-4">
          <Button
            type="button"
            onClick={handleSendClick}
            disabled={loading}
            className="h-9 flex-1 rounded-[10px] bg-[#2563EB] text-[12px] font-semibold text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 size-3 animate-spin" />
                {GMAIL_SEND_CONFIRM_BUTTON_LABEL}
              </>
            ) : (
              GMAIL_SEND_CONFIRM_BUTTON_LABEL
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="h-9 flex-1 rounded-[10px] border-[#CBD5E1]/60 text-[12px] font-medium text-[#64748B]"
          >
            {HELPY_BUTTON_ABBRECHEN}
          </Button>
        </div>
      </div>
    </div>
  );
}
