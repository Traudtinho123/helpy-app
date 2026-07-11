"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpyReviewModal } from "@/features/review/components";
import {
  confirmAppointmentSuggestion,
  createReviewForAppointmentSuggestion,
  getAppointmentSuggestion,
  selectAppointmentSlot,
  subscribeAppointmentSuggestion,
} from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import {
  HELPY_APPOINTMENT_CARD_INTRO,
  HELPY_APPOINTMENT_CARD_TITLE,
  HELPY_APPOINTMENT_CONFIRM_SUCCESS,
  HELPY_APPOINTMENT_SELECT_LABEL,
  HELPY_APPOINTMENT_SAVED_PANEL,
} from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import type { AppointmentSuggestion } from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import {
  HELPY_BUTTON_PRUEFEN,
} from "@/features/review/services/safety";
import type { HelpyReview } from "@/features/review/services/types";
import { recordReviewOpened } from "@/features/workspace/services/status";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import { useExternalStore } from "@/lib/hooks/use-external-store";
import { cn } from "@/lib/utils";

type HelpyAppointmentSuggestionCardProps = {
  vorgang: Vorgang;
  className?: string;
  onRegisterOpenReview?: (open: () => void) => void;
  onConfirmed?: (message: string) => void;
};

function useAppointmentSuggestion(vorgangId: string): AppointmentSuggestion | null {
  return useExternalStore(
    subscribeAppointmentSuggestion,
    () => getAppointmentSuggestion(vorgangId),
    () => null
  );
}

export function HelpyAppointmentSuggestionCard({
  vorgang,
  className,
  onRegisterOpenReview,
  onConfirmed,
}: HelpyAppointmentSuggestionCardProps) {
  const suggestion = useAppointmentSuggestion(vorgang.id);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<HelpyReview | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleOpenReview = useCallback(() => {
    if (!suggestion || suggestion.slots.length === 0) return;
    const selected =
      suggestion.selectedSlotId ?? suggestion.slots[0]?.id ?? null;
    if (!selected) return;

    if (suggestion.selectedSlotId !== selected) {
      selectAppointmentSlot(vorgang.id, selected);
    }

    const current = getAppointmentSuggestion(vorgang.id);
    if (!current) return;

    recordReviewOpened(vorgang.id);
    setActiveReview(createReviewForAppointmentSuggestion(current));
    setReviewOpen(true);
  }, [suggestion, vorgang.id]);

  useEffect(() => {
    if (!onRegisterOpenReview || !suggestion || suggestion.status !== "vorbereitet") {
      return;
    }
    onRegisterOpenReview(handleOpenReview);
  }, [handleOpenReview, onRegisterOpenReview, suggestion]);

  const handleSelectSlot = useCallback(
    (slotId: string) => {
      selectAppointmentSlot(vorgang.id, slotId);
      setFeedback(null);
    },
    [vorgang.id]
  );

  const handleConfirmReview = useCallback(async () => {
    setConfirmLoading(true);
    const result = await confirmAppointmentSuggestion(vorgang.id);
    setConfirmLoading(false);

    if (!result.ok) {
      setFeedback(result.error);
      return;
    }

    setReviewOpen(false);
    setActiveReview(null);
    setFeedback(HELPY_APPOINTMENT_CONFIRM_SUCCESS);
    onConfirmed?.(HELPY_APPOINTMENT_CONFIRM_SUCCESS);
  }, [onConfirmed, vorgang.id]);

  if (!suggestion) return null;

  if (suggestion.status === "loading") {
    return (
      <div
        className={cn(
          "rounded-[18px] border border-[#CBD5E1]/45 bg-gradient-to-br from-white/95 to-[#F8FAFC]/90 p-4 shadow-sm backdrop-blur-sm",
          className
        )}
      >
        <div className="flex items-center gap-2 text-[12px] text-[#64748B]">
          <Loader2 className="size-4 animate-spin text-[#2563EB]" />
          HELPY prüft freie Zeiten in deinem Kalender…
        </div>
      </div>
    );
  }

  if (suggestion.status === "bestaetigt") {
    return (
      <div
        className={cn(
          "rounded-[18px] border border-[#CBD5E1]/45 bg-gradient-to-br from-white/95 to-[#F8FAFC]/90 p-4 shadow-sm backdrop-blur-sm",
          className
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-[#2563EB]" strokeWidth={2} />
            <p className="text-[12px] font-semibold text-[#0F172A]">
              {HELPY_APPOINTMENT_CARD_TITLE}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#A7F3D0]/60 bg-[#ECFDF5]/70 px-2.5 py-0.5 text-[10px] font-semibold text-[#047857]">
            <BadgeCheck className="size-3" strokeWidth={2.5} />
            Termin bestätigt
          </span>
        </div>
        <p className="text-[12px] leading-relaxed text-[#334155]">
          {HELPY_APPOINTMENT_SAVED_PANEL}
        </p>
      </div>
    );
  }

  if (suggestion.status === "fehler") {
    return (
      <div
        className={cn(
          "rounded-[18px] border border-[#CBD5E1]/45 bg-gradient-to-br from-white/95 to-[#F8FAFC]/90 p-4 shadow-sm backdrop-blur-sm",
          className
        )}
      >
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="size-4 text-[#2563EB]" strokeWidth={2} />
          <p className="text-[12px] font-semibold text-[#0F172A]">
            {HELPY_APPOINTMENT_CARD_TITLE}
          </p>
        </div>
        <p className="text-[12px] leading-relaxed text-[#B91C1C]">
          {suggestion.errorMessage ?? "Kein Kalender verbunden."}
        </p>
      </div>
    );
  }

  const selectedSlotId =
    suggestion.selectedSlotId ?? suggestion.slots[0]?.id ?? null;

  return (
    <>
      <HelpyReviewModal
        review={activeReview}
        open={reviewOpen}
        vorgangId={vorgang.id}
        confirmLoading={confirmLoading}
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
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="size-4 text-[#2563EB]" strokeWidth={2} />
          <p className="text-[12px] font-semibold text-[#0F172A]">
            {HELPY_APPOINTMENT_CARD_TITLE}
          </p>
        </div>

        <p className="text-[12px] leading-relaxed text-[#334155]">
          {HELPY_APPOINTMENT_CARD_INTRO}
        </p>

        <ul className="mt-4 space-y-2">
          {suggestion.slots.map((slot) => {
            const isSelected = slot.id === selectedSlotId;
            return (
              <li
                key={slot.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-[12px] border px-3 py-2.5 transition-colors",
                  isSelected
                    ? "border-[#BFDBFE]/70 bg-[#EFF6FF]/70"
                    : "border-[#E2E8F0]/70 bg-white/80"
                )}
              >
                <div>
                  <p className="text-[12px] font-semibold text-[#0F172A]">
                    {slot.dateLabel}
                  </p>
                  <p className="text-[11px] text-[#64748B]">
                    {slot.start}–{slot.end} · {suggestion.durationLabel} ·{" "}
                    {slot.calendarLabel}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSelectSlot(slot.id)}
                  className={cn(
                    "h-8 rounded-[10px] px-3 text-[11px] font-medium",
                    isSelected &&
                      "border-[#2563EB]/30 bg-[#EFF6FF] text-[#2563EB]"
                  )}
                >
                  {HELPY_APPOINTMENT_SELECT_LABEL}
                </Button>
              </li>
            );
          })}
        </ul>

        <Button
          type="button"
          onClick={handleOpenReview}
          disabled={!selectedSlotId}
          className="mt-4 h-9 w-full rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[12px] font-semibold text-white shadow-sm"
        >
          {HELPY_BUTTON_PRUEFEN}
        </Button>

        {feedback && (
          <p className="mt-3 rounded-[10px] border border-[#FECACA]/60 bg-[#FEF2F2]/70 px-3 py-2 text-[11px] leading-relaxed text-[#B91C1C]">
            {feedback}
          </p>
        )}
      </div>
    </>
  );
}
