"use client";

import {
  Calendar,
  FileText,
  Lightbulb,
  ListChecks,
  Sparkles,
  Square,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import { HelpyIconBadge } from "@/components/helpy/helpy-icon-badge";
import type { EmailAnalysisResult } from "@/features/brain/services/helpy-brain/types";
import { cn } from "@/lib/utils";

type HelpyBrainAnalysisViewProps = {
  result: EmailAnalysisResult;
};

const prioritaetStyles = {
  hoch: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
  mittel: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  niedrig: "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]",
} as const;

export function HelpyBrainAnalysisView({ result }: HelpyBrainAnalysisViewProps) {
  return (
    <div className="space-y-5">
      <div className="helpy-fade-in">
        <div className="mb-2 flex items-center gap-2">
          <Badge
            variant="outline"
            className="h-5 rounded-full border-[var(--border-accent)] bg-[var(--accent-light)] px-2 text-[10px] font-semibold text-[var(--accent)]"
          >
            HELPY Analyse
          </Badge>
        </div>
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          Hallo 👋
        </h3>
        <p className="mt-2 text-[13px] leading-[1.65] text-[var(--text-secondary)]">
          {result.helpyNachricht}
        </p>
      </div>

      <div className="helpy-fade-in rounded-[16px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HelpyIconBadge size={16} pose="typing" />
            <p className="text-[12px] font-semibold text-[var(--text-primary)]">
              Zusammenfassung
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "h-5 rounded-full px-2 text-[10px] font-semibold capitalize",
              prioritaetStyles[result.prioritaet]
            )}
          >
            Priorität: {result.prioritaet}
          </Badge>
        </div>
        <p className="text-[12px] leading-[1.65] text-[var(--text-secondary)]">
          {result.zusammenfassung}
        </p>
      </div>

      <div className="helpy-fade-in rounded-[16px] border border-[#FDE68A]/60 bg-[#FFFBEB]/80 p-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="size-4 text-[#D97706]" strokeWidth={2} />
          <p className="text-[12px] font-semibold text-[#B45309]">
            Empfohlene Aktion
          </p>
        </div>
        <p className="mt-2.5 text-[12px] leading-[1.65] text-[var(--text-secondary)]">
          {result.empfohleneAktion}
        </p>
      </div>

      {result.erkannteAufgaben.length > 0 && (
        <div className="helpy-fade-in space-y-3">
          <div className="flex items-center gap-2">
            <ListChecks className="size-4 text-[var(--accent)]" strokeWidth={2} />
            <p className="text-[12px] font-semibold text-[var(--text-primary)]">
              Erkannte Aufgaben
            </p>
          </div>
          <ul className="space-y-2">
            {result.erkannteAufgaben.map((aufgabe) => (
              <li
                key={aufgabe.beschreibung}
                className="flex items-center gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--bg-surface)] px-3.5 py-2.5 shadow-sm"
              >
                <Square
                  className="size-4 shrink-0 text-[var(--text-muted)]"
                  strokeWidth={2}
                />
                <span className="flex-1 text-[12px] font-medium text-[var(--text-secondary)]">
                  {aufgabe.beschreibung}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "h-5 rounded-full px-2 text-[10px] font-semibold",
                    prioritaetStyles[aufgabe.prioritaet]
                  )}
                >
                  {aufgabe.prioritaet}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.erkannteTermine.length > 0 && (
        <div className="helpy-fade-in space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-[#10B981]" strokeWidth={2} />
            <p className="text-[12px] font-semibold text-[var(--text-primary)]">
              Erkannte Termine & Fristen
            </p>
          </div>
          <ul className="space-y-2">
            {result.erkannteTermine.map((termin) => (
              <li
                key={`${termin.titel}-${termin.frist ?? termin.datum}`}
                className="rounded-[12px] border border-[#A7F3D0]/60 bg-[#ECFDF5]/50 px-3.5 py-2.5"
              >
                <p className="text-[12px] font-semibold text-[#047857]">
                  {termin.titel}
                </p>
                {(termin.frist || termin.datum) && (
                  <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                    {termin.frist ?? `${termin.datum}${termin.uhrzeit ? ` · ${termin.uhrzeit}` : ""}`}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.erkannteAngebote.length > 0 && (
        <div className="helpy-fade-in space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-[var(--accent)]" strokeWidth={2} />
            <p className="text-[12px] font-semibold text-[var(--text-primary)]">
              Erkannte Angebote
            </p>
          </div>
          {result.erkannteAngebote.map((angebot) => (
            <Card
              key={angebot.titel}
              className="rounded-[16px] border-[var(--border)] bg-[var(--bg-surface)] py-0 shadow-sm"
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-semibold text-[var(--text-primary)]">
                    {angebot.titel}
                  </p>
                  <Badge
                    variant="outline"
                    className="h-5 shrink-0 border-[#FDE68A] bg-[#FFFBEB] text-[10px] font-semibold text-[#B45309]"
                  >
                    Angebotsanfrage
                  </Badge>
                </div>
                {angebot.menge !== undefined && (
                  <div className="flex justify-between gap-2 text-[12px]">
                    <span className="text-[var(--text-secondary)]">Menge</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {angebot.menge} Arbeitsplätze
                    </span>
                  </div>
                )}
                {angebot.deadline && (
                  <div className="flex justify-between gap-2 text-[12px]">
                    <span className="text-[var(--text-secondary)]">Deadline</span>
                    <Badge
                      variant="outline"
                      className="h-5 border-[#FECACA] bg-[#FEF2F2] text-[10px] font-semibold text-[#DC2626]"
                    >
                      {angebot.deadline}
                    </Badge>
                  </div>
                )}
                {angebot.positionen.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {angebot.positionen.map((pos) => (
                      <Badge
                        key={pos}
                        variant="outline"
                        className="h-5 rounded-full border-[var(--border-accent)] bg-[var(--accent-light)] px-2 text-[10px] font-medium text-[var(--accent)]"
                      >
                        {pos}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="helpy-fade-in space-y-3">
        <p className="text-[12px] font-semibold text-[var(--text-primary)]">
          Antwortentwurf
        </p>
        <div className="rounded-[16px] border border-[var(--border)] bg-gradient-to-br from-[#F8FAFC] to-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
          <div className="mb-3 flex items-center gap-2 border-b border-[var(--border)] pb-3">
            <HelpyAvatar size="sm" />
            <div>
              <p className="text-[11px] font-semibold text-[var(--text-primary)]">HELPY</p>
              <p className="text-[10px] text-[var(--text-muted)]">Entwurf</p>
            </div>
          </div>
          <p className="whitespace-pre-line text-[12px] leading-[1.7] text-[var(--text-secondary)]">
            {result.antwortEntwurf}
          </p>
        </div>
      </div>
    </div>
  );
}

export function HelpyBrainLoadingView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-[20px] border border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center">
      <div className="relative">
        <HelpyAvatar size="md" />
        <Sparkles className="absolute -top-1 -right-1 size-4 animate-pulse text-[var(--accent)]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Ich analysiere die E-Mail…
        </p>
        <p className="mt-1.5 text-[12px] text-[var(--text-secondary)]">
          Ich bereite Aufgaben, Termine und Angebote für dich vor
        </p>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="helpy-pulse-dot size-1.5 rounded-full bg-[#2563EB]"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
