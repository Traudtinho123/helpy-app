"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VorgangStatusTimeline } from "@/features/workspace/components/vorgaenge/vorgang-status-timeline";
import type { HelpyReview, ReviewContent } from "@/features/review/services";
import { REVIEW_MODAL_TITLE } from "@/features/review/services";
import {
  HELPY_BUTTON_ABBRECHEN,
  HELPY_BUTTON_BEARBEITEN,
  HELPY_BUTTON_BESTAETIGEN,
} from "@/features/review/services/safety";
import { getStatusHistory, subscribeStatus } from "@/features/workspace/services/status";

type HelpyReviewModalProps = {
  review: HelpyReview | null;
  open: boolean;
  vorgangId?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onEdit?: () => void;
  /** Status-/Bearbeitungsverlauf im Dialog (Default: an). */
  showHistory?: boolean;
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  confirmDisabledReason?: string | null;
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

function ReviewContentBody({
  content,
  confirmDisabledReason = null,
}: {
  content: ReviewContent;
  confirmDisabledReason?: string | null;
}) {
  switch (content.kind) {
    case "antwort":
      return (
        <div className="space-y-4">
          <ReviewField label="Empfänger" value={content.empfaenger} />
          <ReviewField label="Betreff" value={content.betreff} />
          {confirmDisabledReason && (
            <p className="rounded-[10px] border border-[#FECACA]/60 bg-[#FEF2F2]/70 px-3 py-2 text-[11px] leading-relaxed text-[#B91C1C]">
              {confirmDisabledReason}
            </p>
          )}
          <ReviewField
            label="Antworttext"
            value={content.antworttext}
            multiline
          />
          {content.fehlendeAngaben && content.fehlendeAngaben.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
                Fehlende Angaben
              </p>
              <ul className="mt-2 space-y-1">
                {content.fehlendeAngaben.map((item) => (
                  <li key={item} className="text-[12px] text-[#B45309]">
                    · {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    case "angebot":
      return (
        <div className="space-y-4">
          <ReviewField label="Kunde" value={content.kunde} />
          <div>
            <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
              Positionen
            </p>
            <ul className="mt-2 space-y-1.5">
              {content.positionen.map((pos) => (
                <li
                  key={pos}
                  className="flex gap-2 text-[12px] text-[#334155]"
                >
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[#2563EB]" />
                  {pos}
                </li>
              ))}
            </ul>
          </div>
          <ReviewField label="Summe" value={content.summe} />
          <div>
            <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
              Fehlende Angaben
            </p>
            <ul className="mt-2 space-y-1">
              {content.fehlendeAngaben.map((item) => (
                <li key={item} className="text-[12px] text-[#B45309]">
                  · {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    case "termin":
      return (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {content.anlass && (
              <ReviewField label="Titel" value={content.anlass} />
            )}
            <ReviewField label="Datum" value={content.datum} />
            <ReviewField label="Uhrzeit" value={content.uhrzeit} />
            {content.dauer && (
              <ReviewField label="Dauer" value={content.dauer} />
            )}
            <ReviewField label="Ort" value={content.ort} />
            {content.teilnehmer && (
              <ReviewField label="Teilnehmer" value={content.teilnehmer} />
            )}
            {content.kalender && (
              <ReviewField label="Kalender" value={content.kalender} />
            )}
          </div>
          {confirmDisabledReason && (
            <p className="rounded-[10px] border border-[#FECACA]/60 bg-[#FEF2F2]/70 px-3 py-2 text-[11px] leading-relaxed text-[#B91C1C]">
              {confirmDisabledReason}
            </p>
          )}
          {content.beschreibung && (
            <ReviewField
              label="Beschreibung"
              value={content.beschreibung}
              multiline
            />
          )}
        </div>
      );
    case "kunde":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <ReviewField label="Name" value={content.name} />
          <ReviewField label="Firma" value={content.firma} />
          <ReviewField label="E-Mail" value={content.email} />
          <ReviewField label="Telefon" value={content.telefon} />
        </div>
      );
    case "frist":
      return (
        <div className="space-y-4">
          <ReviewField label="Frist" value={content.frist} />
          <ReviewField label="Grund" value={content.grund} />
          <ReviewField label="Kalenderhinweis" value={content.kalenderhinweis} />
        </div>
      );
    default:
      return (
        <div className="space-y-4">
          <ReviewField label="Zusammenfassung" value={content.zusammenfassung} />
          {content.details.length > 0 && (
            <ul className="space-y-1.5">
              {content.details.map((detail) => (
                <li key={detail} className="text-[12px] text-[#64748B]">
                  · {detail}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
  }
}

export function HelpyReviewModal({
  review,
  open,
  vorgangId,
  onConfirm,
  onCancel,
  onEdit,
  showHistory = true,
  confirmLoading = false,
  confirmDisabled = false,
  confirmDisabledReason = null,
}: HelpyReviewModalProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!showHistory) return;
    return subscribeStatus(() => setTick((value) => value + 1));
  }, [showHistory]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    window.document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open || !review) return null;

  const primaryLabel = review.content.primaryLabel;
  const history =
    showHistory && vorgangId ? getStatusHistory(vorgangId) : [];
  const showEditButton = Boolean(onEdit);

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0F172A]/40 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="helpy-review-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-[#CBD5E1]/50 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
      >
        <div className="flex items-start justify-between border-b border-[#CBD5E1]/40 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-[#2563EB]" strokeWidth={2} />
              <p
                id="helpy-review-title"
                className="text-[14px] font-semibold tracking-[-0.01em] text-[#0F172A]"
              >
                {REVIEW_MODAL_TITLE}
              </p>
            </div>
            <p className="mt-1 text-[13px] font-medium text-[#64748B]">
              {review.actionTitle}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onCancel}
            className="size-9 rounded-[10px] border-[#CBD5E1]/60"
            aria-label="Schließen"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="rounded-[14px] border border-[#BFDBFE]/50 bg-[#EFF6FF]/50 px-4 py-3.5">
            <p className="text-[12px] leading-relaxed text-[#334155]">
              {review.helpyHint}
            </p>
          </div>

          <div className="mt-5">
            <ReviewContentBody
              content={review.content}
              confirmDisabledReason={confirmDisabledReason}
            />
          </div>

          {history.length > 0 && (
            <div className="mt-5">
              <VorgangStatusTimeline entries={history} maxVisible={5} />
            </div>
          )}

          <div className="mt-6">
            <Button
              type="button"
              onClick={onConfirm}
              disabled={confirmLoading || confirmDisabled}
              className="h-10 w-full rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[13px] font-semibold text-white shadow-sm disabled:opacity-50"
            >
              {confirmLoading ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  {primaryLabel}
                </>
              ) : (
                primaryLabel
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-[#CBD5E1]/40 bg-[#F8FAFC]/80 px-6 py-4">
          {showEditButton && (
            <Button
              type="button"
              variant="outline"
              onClick={onEdit}
              className="h-9 flex-1 rounded-[10px] border-[#CBD5E1]/60 text-[12px] font-medium"
            >
              {HELPY_BUTTON_BEARBEITEN}
            </Button>
          )}
          <Button
            type="button"
            onClick={onConfirm}
            disabled={confirmLoading || confirmDisabled}
            className="h-9 flex-1 rounded-[10px] bg-[#2563EB] text-[12px] font-semibold text-white disabled:opacity-50"
          >
            {confirmLoading ? (
              <>
                <Loader2 className="mr-1.5 size-3 animate-spin" />
                {primaryLabel}
              </>
            ) : (
              primaryLabel
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={confirmLoading}
            className="h-9 flex-1 rounded-[10px] border-[#CBD5E1]/60 text-[12px] font-medium text-[#64748B]"
          >
            {HELPY_BUTTON_ABBRECHEN}
          </Button>
        </div>
      </div>
    </div>
  );
}
