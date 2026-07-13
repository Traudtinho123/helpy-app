"use client";

import { useCallback, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  confirmAppointmentSuggestion,
  applyCustomAppointmentSlot,
  getAppointmentSuggestion,
  selectAppointmentSlot,
  subscribeAppointmentSuggestion,
} from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import {
  downloadIcsFile,
} from "@/features/appointment-suggestions/services/viewing-confirmation-mail";
import {
  HELPY_VIEWING_CALENDAR_WRITE_MISSING,
  HELPY_VIEWING_CONFIRM_INVITE_LABEL,
  HELPY_VIEWING_DOWNLOAD_ICS_LABEL,
  HELPY_VIEWING_SLOTS_OFFERED_LABEL,
} from "@/features/appointment-suggestions/types/appointment-suggestion-types";
import { formatGermanDateLabel } from "@/features/appointment-suggestions/services/viewing-date-parser";
import { addMinutesToTimeString } from "@/features/appointment-suggestions/services/viewing-time-parser";
import { useWorkspaceContext } from "@/features/workspace/context";
import { useExternalStore } from "@/lib/hooks/use-external-store";
import { cn } from "@/lib/utils";

function formatShortSlotLabel(dateLabel: string, start: string): string {
  const shortDay = dateLabel.split(",")[0]?.slice(0, 2) ?? dateLabel;
  const dayMonth = dateLabel.split(",")[1]?.trim() ?? "";
  return `${shortDay} ${dayMonth} · ${start} Uhr`;
}

export function HelpyTerminstatusSection() {
  const { workspaceId } = useWorkspaceContext();
  const suggestion = useExternalStore(
    subscribeAppointmentSuggestion,
    () => getAppointmentSuggestion(workspaceId),
    () => null
  );

  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lastIcs, setLastIcs] = useState<string | null>(null);

  const showSection =
    suggestion &&
    (suggestion.confirmationStatus === "slots_offered" ||
      (suggestion.confirmationStatus === "none" && suggestion.slotsOfferedAt));

  const isConfirmed = suggestion?.confirmationStatus === "saved_to_calendar";

  const selectedSlot = useMemo(() => {
    if (!suggestion) return null;
    if (useCustom && customDate && customTime) {
      const end = addMinutesToTimeString(
        customTime,
        suggestion.durationMinutes
      );
      return {
        id: `custom-${workspaceId}`,
        date: customDate,
        dateLabel: formatGermanDateLabel(customDate),
        start: customTime,
        end,
        label: `${formatGermanDateLabel(customDate)} · ${customTime}`,
        durationMinutes: suggestion.durationMinutes,
        calendarLabel: suggestion.calendarLabel ?? "Kalender",
      };
    }
    return (
      suggestion.slots.find((slot) => slot.id === suggestion.selectedSlotId) ??
      null
    );
  }, [
    customDate,
    customTime,
    suggestion,
    useCustom,
    workspaceId,
  ]);

  const handleConfirm = useCallback(async () => {
    if (!suggestion) return;

    if (useCustom) {
      if (!customDate || !customTime) {
        setFeedback("Bitte Datum und Uhrzeit für den alternativen Termin eingeben.");
        return;
      }
      const customId = `custom-${workspaceId}`;
      const end = addMinutesToTimeString(customTime, suggestion.durationMinutes);
      applyCustomAppointmentSlot(workspaceId, {
        id: customId,
        date: customDate,
        dateLabel: formatGermanDateLabel(customDate),
        start: customTime,
        end,
        label: `${formatGermanDateLabel(customDate)} · ${customTime}`,
        durationMinutes: suggestion.durationMinutes,
        calendarLabel: suggestion.calendarLabel ?? "Kalender",
      });
    } else if (!suggestion.selectedSlotId) {
      setFeedback("Bitte wähle einen Termin aus.");
      return;
    }

    setLoading(true);
    const result = await confirmAppointmentSuggestion(workspaceId);
    setLoading(false);

    if (!result.ok) {
      setFeedback(result.error);
      if (result.icsContent) {
        setLastIcs(result.icsContent);
      }
      return;
    }

    setLastIcs(result.icsContent);
    const parts = [
      "Termin bestätigt.",
      result.calendarSaved ? "Kalendereintrag erstellt." : HELPY_VIEWING_CALENDAR_WRITE_MISSING,
      result.inviteSent
        ? "Kalendereinladung an Kunden gesendet."
        : suggestion.contactEmail
          ? "Kalendereinladung konnte nicht automatisch gesendet werden."
          : "Kunden-E-Mail unbekannt — .ics zum Download bereit.",
    ];
    setFeedback(parts.join(" "));
  }, [
    customDate,
    customTime,
    suggestion,
    useCustom,
    workspaceId,
  ]);

  if (!showSection && !isConfirmed) return null;

  if (isConfirmed && suggestion) {
    const slot =
      suggestion.slots.find((item) => item.id === suggestion.selectedSlotId) ??
      suggestion.slots[0];
    return (
      <div className="rounded-[16px] border border-[#A7F3D0]/60 bg-[#ECFDF5]/40 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-[#047857]" />
          <p className="text-[12px] font-semibold text-[#047857]">
            Termin bestätigt
          </p>
        </div>
        {slot && (
          <p className="mt-2 text-[12px] text-[#065F46]">
            📅 Besichtigung: {formatShortSlotLabel(slot.dateLabel, slot.start)}
          </p>
        )}
        {suggestion.errorMessage && (
          <p className="mt-2 text-[11px] text-[#B45309]">{suggestion.errorMessage}</p>
        )}
        {lastIcs && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 h-8 rounded-[10px] text-[11px]"
            onClick={() => downloadIcsFile(lastIcs)}
          >
            <Download className="mr-1.5 size-3.5" />
            {HELPY_VIEWING_DOWNLOAD_ICS_LABEL}
          </Button>
        )}
      </div>
    );
  }

  if (!suggestion || suggestion.slots.length === 0) return null;

  return (
    <div className="rounded-[16px] border border-[#BFDBFE]/50 bg-gradient-to-br from-[#EFF6FF]/60 to-white/90 px-4 py-3.5">
      <div className="flex items-center gap-2">
        <CalendarDays className="size-4 text-[#2563EB]" />
        <p className="text-[12px] font-semibold text-[#0F172A]">Terminstatus</p>
      </div>
      <p className="mt-1 text-[11px] text-[#64748B]">
        📅 Besichtigungstermin — {HELPY_VIEWING_SLOTS_OFFERED_LABEL}
      </p>
      <p className="mt-2 text-[11px] font-medium text-[#334155]">
        Welchen Termin hat der Kunde gewählt?
      </p>

      <div className="mt-3 space-y-2">
        {suggestion.slots.map((slot) => {
          const active =
            !useCustom && suggestion.selectedSlotId === slot.id;
          return (
            <label
              key={slot.id}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-[12px] border px-3 py-2.5 text-[12px] transition-colors",
                active
                  ? "border-[#2563EB]/50 bg-[#EFF6FF]/80 text-[#0F172A]"
                  : "border-[#E2E8F0]/80 bg-white/80 text-[#475569] hover:bg-[#F8FAFC]"
              )}
            >
              <input
                type="radio"
                name={`termin-${workspaceId}`}
                checked={active}
                onChange={() => {
                  setUseCustom(false);
                  selectAppointmentSlot(workspaceId, slot.id);
                }}
                className="size-3.5 accent-[#2563EB]"
              />
              <span>{formatShortSlotLabel(slot.dateLabel, slot.start)}</span>
            </label>
          );
        })}

        <label
          className={cn(
            "flex cursor-pointer items-start gap-2.5 rounded-[12px] border px-3 py-2.5 text-[12px] transition-colors",
            useCustom
              ? "border-[#2563EB]/50 bg-[#EFF6FF]/80"
              : "border-[#E2E8F0]/80 bg-white/80 hover:bg-[#F8FAFC]"
          )}
        >
          <input
            type="radio"
            name={`termin-${workspaceId}`}
            checked={useCustom}
            onChange={() => setUseCustom(true)}
            className="mt-0.5 size-3.5 accent-[#2563EB]"
          />
          <span className="flex-1 space-y-2">
            <span className="block font-medium text-[#334155]">
              Anderer Termin
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                value={customDate}
                onChange={(event) => setCustomDate(event.target.value)}
                className="h-8 rounded-[10px] text-[11px]"
              />
              <Input
                type="time"
                value={customTime}
                onChange={(event) => setCustomTime(event.target.value)}
                className="h-8 rounded-[10px] text-[11px]"
              />
            </div>
          </span>
        </label>
      </div>

      <Button
        type="button"
        disabled={loading}
        onClick={() => void handleConfirm()}
        className="mt-4 h-10 w-full rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[12px] font-semibold text-white"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="size-3.5 animate-spin" />
            Wird eingetragen…
          </span>
        ) : (
          <>
            <CheckCircle2 className="mr-1.5 size-3.5" />
            {HELPY_VIEWING_CONFIRM_INVITE_LABEL}
          </>
        )}
      </Button>

      {feedback && (
        <p
          className={cn(
            "mt-3 rounded-[10px] border px-3 py-2 text-[11px] leading-relaxed",
            feedback.includes("bestätigt")
              ? "border-[#A7F3D0]/60 bg-[#ECFDF5]/70 text-[#047857]"
              : "border-[#FECACA]/60 bg-[#FEF2F2]/70 text-[#B91C1C]"
          )}
        >
          {feedback}
        </p>
      )}

      {lastIcs && !feedback?.includes("gesendet") && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 h-8 w-full rounded-[10px] text-[11px]"
          onClick={() => downloadIcsFile(lastIcs)}
        >
          <Download className="mr-1.5 size-3.5" />
          {HELPY_VIEWING_DOWNLOAD_ICS_LABEL}
        </Button>
      )}
    </div>
  );
}
