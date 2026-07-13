"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWorkspaceVorgangFromListe } from "@/features/workspace/services/workspace/workspace-engine";
import {
  confirmAppointmentSuggestion,
  getAppointmentSuggestion,
  loadAppointmentSuggestionForWorkspace,
  selectAppointmentSlot,
  subscribeAppointmentSuggestion,
} from "@/features/appointment-suggestions/services/appointment-suggestion-engine";
import {
  completeVorgang,
  VORGANG_ERLEDIGT_SUCCESS,
} from "@/features/workspace/services/vorgaenge/complete-vorgang-service";
import type { Vorgang } from "@/features/workspace/services/vorgaenge/types";
import { createClient } from "@/lib/supabase/client";
import { useExternalStore } from "@/lib/hooks/use-external-store";
import { cn } from "@/lib/utils";

type VorgangMiniAppointmentPanelProps = {
  vorgang: Vorgang;
  onDone: (message: string, helpyPanelMessage: string) => void;
  onClose: () => void;
  className?: string;
};

export function VorgangMiniAppointmentPanel({
  vorgang,
  onDone,
  onClose,
  className,
}: VorgangMiniAppointmentPanelProps) {
  const suggestion = useExternalStore(
    subscribeAppointmentSuggestion,
    () => getAppointmentSuggestion(vorgang.id),
    () => null
  );
  const [loading, setLoading] = useState(false);
  const [confirmingSlotId, setConfirmingSlotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const workspace = buildWorkspaceVorgangFromListe(vorgang);
    void loadAppointmentSuggestionForWorkspace(workspace, vorgang);
  }, [vorgang]);

  const handleConfirmSlot = useCallback(
    async (slotId: string) => {
      setConfirmingSlotId(slotId);
      setLoading(true);
      setError(null);
      selectAppointmentSlot(vorgang.id, slotId);

      const appointmentResult = await confirmAppointmentSuggestion(vorgang.id);
      if (!appointmentResult.ok) {
        setLoading(false);
        setConfirmingSlotId(null);
        setError(appointmentResult.error);
        return;
      }

      const supabase = createClient();
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;
      const completeResult = await completeVorgang(vorgang, session?.provider_token);
      setLoading(false);
      setConfirmingSlotId(null);

      if (!completeResult.ok) {
        setError(completeResult.message);
        return;
      }

      onDone(VORGANG_ERLEDIGT_SUCCESS, completeResult.helpyPanelMessage);
    },
    [onDone, vorgang]
  );

  if (!suggestion || suggestion.status === "loading") {
    return (
      <div className={cn("rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] p-3", className)}>
        <div className="flex items-center gap-2 text-[12px] text-[#64748B]">
          <Loader2 className="size-4 animate-spin text-[#2563EB]" />
          HELPY prüft freie Termine…
        </div>
      </div>
    );
  }

  const slots = suggestion.slots.slice(0, 3);

  if (slots.length === 0) {
    return (
      <div className={cn("rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] p-3", className)}>
        <p className="text-[12px] text-[#64748B]">Keine Terminvorschläge verfügbar.</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 text-[11px] font-medium text-[#2563EB]"
        >
          Schliessen
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[12px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/50 p-3",
        className
      )}
      onClick={(event) => event.stopPropagation()}
    >
      <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.05em] text-[#2563EB] uppercase">
        <CalendarDays className="size-3.5" />
        Terminvorschläge
      </p>
      <div className="mt-2 space-y-1.5">
        {slots.map((slot) => {
          const isConfirming = confirmingSlotId === slot.id && loading;
          return (
            <button
              key={slot.id}
              type="button"
              disabled={loading}
              onClick={() => {
                void handleConfirmSlot(slot.id);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-[10px] border px-3 py-2 text-left text-[12px] transition-colors",
                "border-[#CBD5E1]/60 bg-white hover:border-[#2563EB]/40 hover:bg-[#EFF6FF]",
                loading && confirmingSlotId !== slot.id && "opacity-50"
              )}
            >
              <span className="font-medium text-[#0F172A]">{slot.label}</span>
              {isConfirming ? (
                <Loader2 className="size-3.5 animate-spin text-[#2563EB]" />
              ) : (
                <span className="text-[10px] font-semibold text-[#2563EB]">
                  Bestätigen
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error ? <p className="mt-2 text-[11px] text-[#DC2626]">{error}</p> : null}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onClose}
        className="mt-2 h-7 rounded-[8px] text-[11px]"
      >
        Abbrechen
      </Button>
    </div>
  );
}
