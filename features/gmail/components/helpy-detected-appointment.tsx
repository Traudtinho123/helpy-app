"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  acceptAppointmentFromEmail,
  appointmentStatus,
  dismissAppointment,
  useCalendarStore,
} from "@/features/calendar/services/calendar-events-store";
import type { DetectedAppointment } from "@/features/gmail/mock/mock-emails";

type HelpyDetectedAppointmentProps = {
  emailId: string;
  appointment: DetectedAppointment;
};

type CardState = "visible" | "adopting" | "hidden";

function initialCardState(emailId: string): CardState {
  const status = appointmentStatus(emailId);
  return status === "accepted" || status === "dismissed" ? "hidden" : "visible";
}

export function HelpyDetectedAppointment({
  emailId,
  appointment,
}: HelpyDetectedAppointmentProps) {
  return (
    <HelpyDetectedAppointmentInner
      key={emailId}
      emailId={emailId}
      appointment={appointment}
    />
  );
}

function HelpyDetectedAppointmentInner({
  emailId,
  appointment,
}: HelpyDetectedAppointmentProps) {
  useCalendarStore();
  const [cardState, setCardState] = useState<CardState>(() =>
    initialCardState(emailId)
  );

  useEffect(() => {
    if (cardState !== "adopting") return;

    const timer = setTimeout(() => {
      acceptAppointmentFromEmail(emailId, appointment);
      setCardState("hidden");
    }, 2000);

    return () => clearTimeout(timer);
  }, [cardState, emailId, appointment]);

  if (cardState === "hidden") return null;

  const handleAccept = () => {
    setCardState("adopting");
  };

  const handleDismiss = () => {
    dismissAppointment(emailId);
    setCardState("hidden");
  };

  if (cardState === "adopting") {
    return (
      <div className="helpy-fade-in rounded-[16px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/80 p-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="size-6 animate-spin text-[#2563EB]" />
          <p className="text-[13px] font-semibold text-[#0F172A]">
            HELPY trägt den Termin ein…
          </p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={`pulse-${i}`}
                className="helpy-pulse-dot size-1.5 rounded-full bg-[#2563EB]"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="helpy-fade-in rounded-[16px] border border-[#BFDBFE]/60 bg-gradient-to-br from-[#EFF6FF]/80 to-white/90 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.04em] text-[#2563EB] uppercase">
            Termin erkannt
          </p>
          <p className="mt-2 text-[13px] font-semibold text-[#0F172A]">
            {appointment.title}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDismiss}
          className="size-8 shrink-0 rounded-[10px] text-[#64748B] hover:text-[#DC2626]"
          aria-label="Terminvorschlag ausblenden"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="mt-4 space-y-1.5">
        <p className="text-[13px] font-medium text-[#2563EB]">
          {appointment.time}
        </p>
        <p className="text-[13px] text-[#334155]">{appointment.company}</p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Button
          onClick={handleAccept}
          className="h-9 w-full justify-start gap-2 rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[12px] font-semibold text-white shadow-sm"
        >
          <Check className="size-4" />
          Termin bestätigen
        </Button>
        <Button
          variant="outline"
          className="h-9 w-full justify-start gap-2 rounded-[12px] border-[#CBD5E1]/60 bg-white text-[12px] font-medium"
        >
          <Pencil className="size-4" />
          Termin bearbeiten
        </Button>
        <Button
          variant="ghost"
          onClick={handleDismiss}
          className="h-9 w-full justify-start gap-2 rounded-[12px] text-[12px] font-medium text-[#64748B] hover:text-[#DC2626]"
        >
          <X className="size-4" />
          Vorschlag verwerfen
        </Button>
      </div>
    </div>
  );
}
