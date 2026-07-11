"use client";

import { useCallback, useState } from "react";
import { BadgeCheck, CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/Panel";
import {
  confirmVoicePhoneAppointment,
} from "@/features/voice/services/voice-phone-appointment-service";
import {
  getVoiceAppointmentProposal,
  subscribeVoiceVorgaenge,
} from "@/features/voice/services/voice-vorgaenge-store";
import {
  hasCompleteVoiceAppointmentDateTime,
  type VoiceAppointmentProposal,
} from "@/features/voice/types/voice-types";
import { useExternalStore } from "@/lib/hooks/use-external-store";
import { cn } from "@/lib/utils";

type VoicePhoneAppointmentCardProps = {
  vorgangId: string;
  className?: string;
};

function useVoiceAppointmentProposal(
  vorgangId: string
): VoiceAppointmentProposal | null {
  return useExternalStore(
    subscribeVoiceVorgaenge,
    () => getVoiceAppointmentProposal(vorgangId),
    () => null
  );
}

function formatGermanDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}`;
}

export function VoicePhoneAppointmentCard({
  vorgangId,
  className,
}: VoicePhoneAppointmentCardProps) {
  const proposal = useVoiceAppointmentProposal(vorgangId);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleConfirm = useCallback(async () => {
    if (!proposal || proposal.calendarStatus === "confirmed") return;
    setLoading(true);
    setFeedback(null);

    const result = await confirmVoicePhoneAppointment(vorgangId);
    setLoading(false);

    if (result.ok) {
      setFeedback({ type: "success", message: result.message });
    } else {
      setFeedback({ type: "error", message: result.error });
    }
  }, [proposal, vorgangId]);

  if (!proposal) return null;

  const hasDateTime = hasCompleteVoiceAppointmentDateTime(proposal);
  const isConfirmed = proposal.calendarStatus === "confirmed";
  const kindLabel =
    proposal.appointmentKind === "besichtigung" ? "Besichtigung" : "Rückruf";

  return (
    <Panel className={cn("space-y-4", className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold text-[#0F172A]">
            Terminvorschlag aus Telefonat
          </h2>
          <p className="mt-0.5 text-[13px] text-[#64748B]">
            HELPY hat einen {kindLabel.toLowerCase()}-Termin aus dem Gespräch
            erkannt.
          </p>
        </div>
      </div>

      <dl className="grid gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-[13px]">
        {proposal.objekt && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-[#64748B]">Objekt</dt>
            <dd className="font-medium text-[#0F172A]">{proposal.objekt}</dd>
          </div>
        )}
        {hasDateTime && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-[#64748B]">Termin</dt>
            <dd className="font-medium text-[#0F172A]">
              {formatGermanDate(proposal.terminDatum!)} · {proposal.terminUhrzeit}{" "}
              Uhr ({proposal.terminDauerMinuten} Min.)
            </dd>
          </div>
        )}
        {proposal.anruferName && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-[#64748B]">Anrufer</dt>
            <dd className="font-medium text-[#0F172A]">{proposal.anruferName}</dd>
          </div>
        )}
        {proposal.anruferNummerMasked && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-[#64748B]">Telefon</dt>
            <dd className="font-medium text-[#0F172A]">
              {proposal.anruferNummerMasked}
            </dd>
          </div>
        )}
        {proposal.notizen && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-[#64748B]">Notizen</dt>
            <dd className="text-[#0F172A]">{proposal.notizen}</dd>
          </div>
        )}
      </dl>

      {hasDateTime ? (
        <div className="space-y-2">
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={loading || isConfirmed}
            onClick={() => void handleConfirm()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird eingetragen…
              </>
            ) : isConfirmed ? (
              <>
                <BadgeCheck className="mr-2 h-4 w-4" />
                Im Kalender eingetragen
              </>
            ) : (
              <>✓ Termin im Kalender eintragen</>
            )}
          </Button>
          <p className="text-[12px] text-[#64748B]">
            Termin wird im verbundenen Apple Kalender vorbereitet.
          </p>
        </div>
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
          Datum erfragen und manuell eintragen — im Gespräch wurde kein
          konkretes Datum genannt.
        </p>
      )}

      {feedback && (
        <p
          className={cn(
            "rounded-lg px-3 py-2 text-[13px]",
            feedback.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-red-200 bg-red-50 text-red-800"
          )}
        >
          {feedback.message}
        </p>
      )}
    </Panel>
  );
}
