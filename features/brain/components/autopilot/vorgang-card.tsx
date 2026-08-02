"use client";

import {
  Archive,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Receipt,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  PreparedVorgang,
  VorgangActionType,
  VorgangTyp,
} from "@/features/brain/services/autopilot";
import { cn } from "@/lib/utils";

type VorgangCardProps = {
  vorgang: PreparedVorgang;
  isOpening?: boolean;
  onAction: (vorgangId: string, action: VorgangActionType) => void;
};

const typConfig: Record<
  VorgangTyp,
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
  nachricht: {
    label: "Nachricht",
    icon: Mail,
    badge: "border-[var(--border-accent)] bg-[var(--accent-light)] text-[var(--accent)]",
  },
};

const prioritaetStyles: Record<
  PreparedVorgang["prioritaet"],
  string
> = {
  hoch: "border-[#FECACA]/60 bg-[#FEF2F2]/80 text-[#DC2626]",
  mittel: "border-[#FDE68A]/60 bg-[#FFFBEB]/80 text-[#B45309]",
  niedrig: "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
};

const statusLabels: Record<PreparedVorgang["status"], string> = {
  vorbereitet: "Vorbereitet",
  in_bearbeitung: "In Bearbeitung",
  erledigt: "Erledigt",
  geoeffnet: "Geöffnet",
};

const statusStyles: Record<PreparedVorgang["status"], string> = {
  vorbereitet: "border-[var(--border-accent)] bg-[var(--accent-light)] text-[var(--accent)]",
  in_bearbeitung: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  erledigt: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
  geoeffnet: "border-[#C4B5FD] bg-[#F5F3FF] text-[#7C3AED]",
};

function VorgangActions({
  vorgang,
  isOpening,
  onAction,
}: VorgangCardProps) {
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
            className={cn(btnClass, "border-[var(--border)] hover:bg-[#ECFDF5]")}
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
            className={cn(btnClass, "border-[var(--border)] hover:bg-[#FFFBEB]")}
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
            className={cn(btnClass, "border-[var(--border)] hover:bg-[#ECFDF5]")}
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
            className={cn(btnClass, "border-[var(--border)] hover:bg-[#ECFDF5]")}
          >
            Als erledigt markieren
          </Button>
        </div>
      );
    case "nachricht":
      return (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={disabled}
            onClick={() => onAction(vorgang.id, "antworten")}
            className={cn(btnClass, "bg-[#2563EB] text-white hover:bg-[#1D4ED8]")}
          >
            <MessageSquare className="size-3.5" />
            Antworten
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => onAction(vorgang.id, "archivieren")}
            className={cn(btnClass, "border-[var(--border)] hover:bg-[var(--bg-elevated)]")}
          >
            <Archive className="size-3.5" />
            Archivieren
          </Button>
        </div>
      );
  }
}

export function VorgangCard({ vorgang, isOpening, onAction }: VorgangCardProps) {
  const config = typConfig[vorgang.typ];
  const Icon = config.icon;
  const isDone = vorgang.status === "erledigt";

  return (
    <Card
      className={cn(
        "helpy-fade-in rounded-[20px] border py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04)] backdrop-blur-xl transition-all duration-500",
        isDone
          ? "border-[var(--border)] bg-[var(--bg-elevated)] opacity-75"
          : "border-[var(--border)] bg-[var(--bg-surface)] ring-1 ring-white hover:shadow-[0_8px_24px_rgba(37,99,235,0.08)]"
      )}
    >
      <CardContent className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={cn("h-6 gap-1 rounded-full px-2.5 text-[10px] font-semibold", config.badge)}
          >
            <Icon className="size-3" />
            {config.label}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "h-6 rounded-full px-2.5 text-[10px] font-semibold capitalize",
              prioritaetStyles[vorgang.prioritaet]
            )}
          >
            {vorgang.prioritaet}
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

        <p className="text-[14px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          {vorgang.kunde}
        </p>
        <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">{vorgang.absender}</p>

        <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-muted)]">
          {vorgang.zusammenfassung}
        </p>

        <div
          className={cn(
            "mt-4 rounded-[12px] border px-3.5 py-3",
            isDone
              ? "border-[var(--border)] bg-[var(--bg-elevated)]/50"
              : "border-[var(--border-accent)]/50 bg-[var(--accent-light)]/40"
          )}
        >
          <p className="text-[11px] font-semibold text-[var(--accent)]">
            HELPY Empfehlung
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-secondary)]">
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
