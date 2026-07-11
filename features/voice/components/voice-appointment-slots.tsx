"use client";

import { useCallback, useState } from "react";
import { CalendarDays, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  confirmAppointmentSuggestion,
  getAppointmentSuggestion,
  selectAppointmentSlot,
  subscribeAppointmentSuggestion,
} from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import {
  HELPY_APPOINTMENT_CONFIRM_SUCCESS,
  HELPY_APPOINTMENT_NO_CALENDAR,
} from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import { useExternalStore } from "@/lib/hooks/use-external-store";
import { cn } from "@/lib/utils";

type VoiceAppointmentSlotsProps = {
  vorgangId: string;
  className?: string;
  onConfirmed?: (message: string) => void;
};

export function VoiceAppointmentSlots({
  vorgangId,
  className,
  onConfirmed,
}: VoiceAppointmentSlotsProps) {
  const suggestion = useExternalStore(
    subscribeAppointmentSuggestion,
    () => getAppointmentSuggestion(vorgangId),
    () => null
  );
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleConfirm = useCallback(async () => {
    if (!suggestion?.selectedSlotId) return;
    setConfirming(true);
    const result = await confirmAppointmentSuggestion(vorgangId);
    setConfirming(false);
    if (result.ok) {
      const message = HELPY_APPOINTMENT_CONFIRM_SUCCESS;
      setFeedback(message);
      onConfirmed?.(message);
      return;
    }
    setFeedback(result.error);
  }, [onConfirmed, suggestion?.selectedSlotId, vorgangId]);

  if (!suggestion) return null;

  if (suggestion.status === "loading") {
    return (
      <div className={cn("flex items-center gap-2 text-[12px] text-[#64748B]", className)}>
        <Loader2 className="size-4 animate-spin" />
        Kalender-Verfügbarkeit wird geprüft…
      </div>
    );
  }

  if (suggestion.status === "bestaetigt") {
    return (
      <div
        className={cn(
          "rounded-[14px] border border-[#A7F3D0] bg-[#ECFDF5]/80 px-3 py-2 text-[12px] text-[#047857]",
          className
        )}
      >
        Termin im Kalender gespeichert.
      </div>
    );
  }

  if (suggestion.status === "fehler" || suggestion.slots.length === 0) {
    return (
      <div
        className={cn(
          "rounded-[14px] border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-[12px] text-[#92400E]",
          className
        )}
      >
        {suggestion.errorMessage ?? HELPY_APPOINTMENT_NO_CALENDAR}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-[11px] font-semibold text-[#64748B]">
        <CalendarDays className="size-3.5" />
        Terminvorschläge ({suggestion.calendarLabel ?? "Kalender"})
      </div>
      <div className="space-y-2">
        {suggestion.slots.map((slot) => {
          const selected = suggestion.selectedSlotId === slot.id;
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => selectAppointmentSlot(vorgangId, slot.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-[12px] border px-3 py-2 text-left text-[12px] transition-colors",
                selected
                  ? "border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]"
                  : "border-[#E2E8F0] bg-white text-[#475569] hover:border-[#2563EB]/40"
              )}
            >
              <span>{slot.label}</span>
              {selected && <Check className="size-3.5" />}
            </button>
          );
        })}
      </div>
      <Button
        type="button"
        size="sm"
        disabled={!suggestion.selectedSlotId || confirming}
        onClick={() => void handleConfirm()}
      >
        {confirming ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <CalendarDays className="size-3.5" />
        )}
        Termin bestätigen & in Kalender speichern
      </Button>
      {feedback && (
        <p className="text-[11px] text-[#64748B]">{feedback}</p>
      )}
    </div>
  );
}
