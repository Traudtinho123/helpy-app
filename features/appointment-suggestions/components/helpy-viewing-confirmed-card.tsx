"use client";

import { useCallback, useState } from "react";
import { BadgeCheck, CalendarCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpyReviewModal } from "@/features/review/components";
import {
  createReviewForAppointmentSuggestion,
  getAppointmentSuggestion,
  saveCustomerConfirmedViewing,
  subscribeAppointmentSuggestion,
} from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import {
  HELPY_APPOINTMENT_CONFIRM_SUCCESS,
  HELPY_VIEWING_CONFIRMED_TITLE,
  HELPY_VIEWING_SAVE_BUTTON,
  HELPY_VIEWING_TIME_UNRECOGNIZED,
} from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import type { HelpyReview } from "@/features/review/services/types";
import { recordReviewOpened } from "@/features/workspace/services/status";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import { useExternalStore } from "@/lib/hooks/use-external-store";
import { cn } from "@/lib/utils";

type HelpyViewingConfirmedCardProps = {
  vorgang: Vorgang;
  className?: string;
  onSaved?: (message: string) => void;
};

export function HelpyViewingConfirmedCard({
  vorgang,
  className,
  onSaved,
}: HelpyViewingConfirmedCardProps) {
  const suggestion = useExternalStore(
    subscribeAppointmentSuggestion,
    () => getAppointmentSuggestion(vorgang.id),
    () => null
  );
  const [reviewOpen, setReviewOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<HelpyReview | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const confirmation = suggestion?.viewingConfirmation;
  const timeMissing = Boolean(confirmation && !confirmation.timeRecognized);

  const handleOpenReview = useCallback(() => {
    if (!suggestion || !confirmation) return;
    recordReviewOpened(vorgang.id);
    setActiveReview(
      createReviewForAppointmentSuggestion(suggestion, {
        customerConfirmed: true,
      })
    );
    setReviewOpen(true);
  }, [confirmation, suggestion, vorgang.id]);

  const handleConfirmReview = useCallback(async () => {
    setConfirmLoading(true);
    const result = await saveCustomerConfirmedViewing(vorgang.id);
    setConfirmLoading(false);

    if (!result.ok) {
      setFeedback(result.error);
      return;
    }

    setReviewOpen(false);
    setActiveReview(null);
    setFeedback(HELPY_APPOINTMENT_CONFIRM_SUCCESS);
    onSaved?.(HELPY_APPOINTMENT_CONFIRM_SUCCESS);
  }, [onSaved, vorgang.id]);

  if (
    !suggestion ||
    !confirmation ||
    (suggestion.confirmationStatus !== "customer_confirmed" &&
      suggestion.confirmationStatus !== "saved_to_calendar")
  ) {
    return null;
  }

  if (suggestion.confirmationStatus === "saved_to_calendar") {
    return (
      <div
        className={cn(
          "rounded-[18px] border border-[#CBD5E1]/45 bg-gradient-to-br from-white/95 to-[#F8FAFC]/90 p-4 shadow-sm backdrop-blur-sm",
          className
        )}
      >
        <div className="mb-3 flex items-center gap-2">
          <CalendarCheck className="size-4 text-[#047857]" strokeWidth={2} />
          <p className="text-[12px] font-semibold text-[#0F172A]">
            {HELPY_VIEWING_CONFIRMED_TITLE}
          </p>
        </div>
        <p className="text-[12px] leading-relaxed text-[#047857]">
          {HELPY_APPOINTMENT_CONFIRM_SUCCESS}
        </p>
      </div>
    );
  }

  return (
    <>
      <HelpyReviewModal
        review={activeReview}
        open={reviewOpen}
        vorgangId={vorgang.id}
        confirmLoading={confirmLoading}
        confirmDisabled={timeMissing}
        confirmDisabledReason={
          timeMissing ? HELPY_VIEWING_TIME_UNRECOGNIZED : null
        }
        onConfirm={() => {
          void handleConfirmReview();
        }}
        onCancel={() => {
          if (!confirmLoading) {
            setReviewOpen(false);
            setActiveReview(null);
          }
        }}
      />

      <div
        className={cn(
          "rounded-[18px] border border-[#CBD5E1]/45 bg-gradient-to-br from-white/95 to-[#F8FAFC]/90 p-4 shadow-sm backdrop-blur-sm",
          className
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="size-4 text-[#2563EB]" strokeWidth={2} />
            <p className="text-[12px] font-semibold text-[#0F172A]">
              {HELPY_VIEWING_CONFIRMED_TITLE}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#A7F3D0]/60 bg-[#ECFDF5]/70 px-2.5 py-0.5 text-[10px] font-semibold text-[#047857]">
            <BadgeCheck className="size-3" strokeWidth={2.5} />
            Termin bestätigt
          </span>
        </div>

        <dl className="space-y-2 text-[12px]">
          <div className="flex justify-between gap-3">
            <dt className="text-[#64748B]">Interessent</dt>
            <dd className="font-medium text-[#0F172A]">{confirmation.interessent}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#64748B]">Objekt</dt>
            <dd className="font-medium text-[#0F172A]">{confirmation.objekt}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#64748B]">Datum</dt>
            <dd className="font-medium text-[#0F172A]">{confirmation.dateLabel}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#64748B]">Uhrzeit</dt>
            <dd className="font-medium text-[#0F172A]">
              {confirmation.timeRecognized
                ? `${confirmation.start}–${confirmation.end}`
                : HELPY_VIEWING_TIME_UNRECOGNIZED}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#64748B]">Kalender</dt>
            <dd className="font-medium text-[#0F172A]">
              {suggestion.calendarLabel ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[#64748B]">Dauer</dt>
            <dd className="font-medium text-[#0F172A]">{confirmation.durationLabel}</dd>
          </div>
          {confirmation.location && (
            <div className="flex justify-between gap-3">
              <dt className="text-[#64748B]">Ort</dt>
              <dd className="font-medium text-[#0F172A]">{confirmation.location}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-[#64748B]">Quelle</dt>
            <dd className="font-medium text-[#0F172A]">{confirmation.quelle}</dd>
          </div>
        </dl>

        <Button
          type="button"
          onClick={handleOpenReview}
          disabled={confirmLoading || timeMissing}
          className="mt-4 h-9 w-full rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[12px] font-semibold text-white shadow-sm disabled:opacity-50"
        >
          {confirmLoading ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              {HELPY_VIEWING_SAVE_BUTTON}
            </>
          ) : (
            HELPY_VIEWING_SAVE_BUTTON
          )}
        </Button>

        {timeMissing && (
          <p className="mt-3 rounded-[10px] border border-[#FECACA]/60 bg-[#FEF2F2]/70 px-3 py-2 text-[11px] leading-relaxed text-[#B91C1C]">
            {HELPY_VIEWING_TIME_UNRECOGNIZED}
          </p>
        )}

        {feedback && (
          <p className="mt-3 rounded-[10px] border border-[#FECACA]/60 bg-[#FEF2F2]/70 px-3 py-2 text-[11px] leading-relaxed text-[#B91C1C]">
            {feedback}
          </p>
        )}
      </div>
    </>
  );
}
