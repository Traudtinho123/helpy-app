"use client";

import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Receipt,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  IntakeVorgang,
  IntakeVorgangActionType,
  IntakeVorgangTyp,
} from "@/features/brain/services/intake";
import { cn } from "@/lib/utils";

type IntakeVorgangCardProps = {
  vorgang: IntakeVorgang;
  isOpening?: boolean;
  onAction: (vorgangId: string, action: IntakeVorgangActionType) => void;
};

const typConfig: Record<
  IntakeVorgangTyp,
  { label: string; icon: typeof FileText; badge: string }
> = {
  aufgabe: {
    label: "Aufgabe",
    icon: CheckCircle2,
    badge: "border-[#E9D5FF] bg-[#FAF5FF] text-[#7C3AED]",
  },
  angebot: {
    label: "Angebot",
    icon: FileText,
    badge: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  },
  termin: {
    label: "Termin",
    icon: Calendar,
    badge: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
  },
  rechnung: {
    label: "Rechnung",
    icon: Receipt,
    badge: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
  },
  formularanfrage: {
    label: "Formularanfrage",
    icon: UserPlus,
    badge: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
  },
};

const statusLabels: Record<IntakeVorgang["status"], string> = {
  vorbereitet: "Vorbereitet",
  in_bearbeitung: "In Bearbeitung",
  erledigt: "Erledigt",
  geoeffnet: "Geöffnet",
};

const statusStyles: Record<IntakeVorgang["status"], string> = {
  vorbereitet: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
  in_bearbeitung: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  erledigt: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
  geoeffnet: "border-[#C4B5FD] bg-[#F5F3FF] text-[#7C3AED]",
};

function VorgangActions({
  vorgang,
  isOpening,
  onAction,
}: IntakeVorgangCardProps) {
  const disabled = vorgang.status === "erledigt";
  const btnClass =
    "h-9 rounded-[10px] text-[12px] font-semibold transition-all duration-300";

  switch (vorgang.typ) {
    case "aufgabe":
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onAction(vorgang.id, "als_erledigt")}
            className={cn(btnClass, "border-[#CBD5E1]/60 hover:bg-[#ECFDF5]")}
          >
            Als erledigt markieren
          </Button>
          <Button
            size="sm"
            disabled={disabled || isOpening}
            onClick={() => onAction(vorgang.id, "zur_aufgabe")}
            className={cn(btnClass, "bg-[#2563EB] text-white hover:bg-[#1D4ED8]")}
          >
            {isOpening ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <>
                <ExternalLink className="size-3.5" />
                Zur Aufgabe
              </>
            )}
          </Button>
        </div>
      );
    case "angebot":
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={disabled || isOpening}
            onClick={() => onAction(vorgang.id, "angebot_oeffnen")}
            className={cn(btnClass, "bg-[#2563EB] text-white hover:bg-[#1D4ED8]")}
          >
            {isOpening ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <>
                <ExternalLink className="size-3.5" />
                Angebot öffnen
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onAction(vorgang.id, "angebot_vorbereiten")}
            className={cn(btnClass, "border-[#CBD5E1]/60 hover:bg-[#FFFBEB]")}
          >
            Angebot vorbereiten
          </Button>
        </div>
      );
    case "termin":
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={disabled}
            onClick={() => onAction(vorgang.id, "termin_uebernehmen")}
            className={cn(btnClass, "bg-[#2563EB] text-white hover:bg-[#1D4ED8]")}
          >
            Termin bestätigen
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled || isOpening}
            onClick={() => onAction(vorgang.id, "kalender_oeffnen")}
            className={cn(btnClass, "border-[#CBD5E1]/60 hover:bg-[#ECFDF5]")}
          >
            {isOpening ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <>
                <Calendar className="size-3.5" />
                Kalender öffnen
              </>
            )}
          </Button>
        </div>
      );
    case "rechnung":
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={disabled || isOpening}
            onClick={() => onAction(vorgang.id, "rechnung_pruefen")}
            className={cn(btnClass, "bg-[#2563EB] text-white hover:bg-[#1D4ED8]")}
          >
            {isOpening ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              "Rechnung prüfen"
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onAction(vorgang.id, "als_erledigt")}
            className={cn(btnClass, "border-[#CBD5E1]/60 hover:bg-[#ECFDF5]")}
          >
            Als erledigt markieren
          </Button>
        </div>
      );
    case "formularanfrage":
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={disabled || isOpening}
            onClick={() => onAction(vorgang.id, "kundenanfrage_oeffnen")}
            className={cn(btnClass, "bg-[#2563EB] text-white hover:bg-[#1D4ED8]")}
          >
            {isOpening ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <>
                <ExternalLink className="size-3.5" />
                Kundenanfrage öffnen
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onAction(vorgang.id, "kunde_anlegen")}
            className={cn(btnClass, "border-[#CBD5E1]/60 hover:bg-[#EFF6FF]")}
          >
            <UserPlus className="size-3.5" />
            Kunde anlegen
          </Button>
        </div>
      );
  }
}

export function IntakeVorgangCard({
  vorgang,
  isOpening,
  onAction,
}: IntakeVorgangCardProps) {
  const config = typConfig[vorgang.typ];
  const Icon = config.icon;
  const isDone = vorgang.status === "erledigt";

  return (
    <Card
      className={cn(
        "helpy-fade-in rounded-[20px] border py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04)] backdrop-blur-xl transition-all duration-500",
        isDone
          ? "border-[#CBD5E1]/30 bg-[#F8FAFC]/60 opacity-75"
          : "border-[#CBD5E1]/50 bg-white/90 ring-1 ring-white hover:shadow-[0_8px_24px_rgba(37,99,235,0.08)]"
      )}
    >
      <CardContent className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "h-6 gap-1 rounded-full px-2.5 text-[10px] font-semibold",
              config.badge
            )}
          >
            <Icon className="size-3" />
            {config.label}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "h-6 rounded-full px-2.5 text-[10px] font-semibold",
              statusStyles[vorgang.status]
            )}
          >
            {statusLabels[vorgang.status]}
          </Badge>
        </div>

        <p className="text-[14px] font-semibold tracking-[-0.01em] text-[#0F172A]">
          {vorgang.kunde}
        </p>
        <p className="mt-0.5 text-[12px] text-[#64748B]">{vorgang.absender}</p>

        <p className="mt-3 text-[13px] leading-relaxed text-[#475569]">
          {vorgang.zusammenfassung}
        </p>

        <div
          className={cn(
            "mt-4 rounded-[12px] border px-3.5 py-3",
            isDone
              ? "border-[#CBD5E1]/30 bg-[#F8FAFC]/50"
              : "border-[#BFDBFE]/50 bg-[#EFF6FF]/40"
          )}
        >
          <p className="text-[11px] font-semibold text-[#2563EB]">
            HELPY Empfehlung
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[#334155]">
            {vorgang.helpyEmpfehlung}
          </p>
        </div>

        <div className="mt-4">
          <VorgangActions
            vorgang={vorgang}
            isOpening={isOpening}
            onAction={onAction}
          />
        </div>
      </CardContent>
    </Card>
  );
}
