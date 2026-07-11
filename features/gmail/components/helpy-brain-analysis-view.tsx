"use client";

import {
  Bot,
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
import type { EmailAnalysisResult } from "@/features/brain/services/helpy-brain/types";
import { cn } from "@/lib/utils";

type HelpyBrainAnalysisViewProps = {
  result: EmailAnalysisResult;
};

const prioritaetStyles = {
  hoch: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
  mittel: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
  niedrig: "border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B]",
} as const;

export function HelpyBrainAnalysisView({ result }: HelpyBrainAnalysisViewProps) {
  return (
    <div className="space-y-5">
      <div className="helpy-fade-in">
        <div className="mb-2 flex items-center gap-2">
          <Badge
            variant="outline"
            className="h-5 rounded-full border-[#BFDBFE] bg-[#EFF6FF] px-2 text-[10px] font-semibold text-[#2563EB]"
          >
            HELPY Analyse
          </Badge>
        </div>
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[#0F172A]">
          Hallo 👋
        </h3>
        <p className="mt-2 text-[13px] leading-[1.65] text-[#334155]">
          {result.helpyNachricht}
        </p>
      </div>

      <div className="helpy-fade-in rounded-[16px] border border-[#CBD5E1]/40 bg-white/90 p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bot className="size-4 text-[#2563EB]" strokeWidth={2} />
            <p className="text-[12px] font-semibold text-[#0F172A]">
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
        <p className="text-[12px] leading-[1.65] text-[#334155]">
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
        <p className="mt-2.5 text-[12px] leading-[1.65] text-[#334155]">
          {result.empfohleneAktion}
        </p>
      </div>

      {result.erkannteAufgaben.length > 0 && (
        <div className="helpy-fade-in space-y-3">
          <div className="flex items-center gap-2">
            <ListChecks className="size-4 text-[#2563EB]" strokeWidth={2} />
            <p className="text-[12px] font-semibold text-[#0F172A]">
              Erkannte Aufgaben
            </p>
          </div>
          <ul className="space-y-2">
            {result.erkannteAufgaben.map((aufgabe) => (
              <li
                key={aufgabe.beschreibung}
                className="flex items-center gap-3 rounded-[12px] border border-[#CBD5E1]/40 bg-white px-3.5 py-2.5 shadow-sm"
              >
                <Square
                  className="size-4 shrink-0 text-[#94A3B8]"
                  strokeWidth={2}
                />
                <span className="flex-1 text-[12px] font-medium text-[#334155]">
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
            <p className="text-[12px] font-semibold text-[#0F172A]">
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
                  <p className="mt-0.5 text-[11px] text-[#64748B]">
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
            <FileText className="size-4 text-[#2563EB]" strokeWidth={2} />
            <p className="text-[12px] font-semibold text-[#0F172A]">
              Erkannte Angebote
            </p>
          </div>
          {result.erkannteAngebote.map((angebot) => (
            <Card
              key={angebot.titel}
              className="rounded-[16px] border-[#CBD5E1]/40 bg-white py-0 shadow-sm"
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[12px] font-semibold text-[#0F172A]">
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
                    <span className="text-[#64748B]">Menge</span>
                    <span className="font-semibold text-[#0F172A]">
                      {angebot.menge} Arbeitsplätze
                    </span>
                  </div>
                )}
                {angebot.deadline && (
                  <div className="flex justify-between gap-2 text-[12px]">
                    <span className="text-[#64748B]">Deadline</span>
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
                        className="h-5 rounded-full border-[#BFDBFE] bg-[#EFF6FF] px-2 text-[10px] font-medium text-[#2563EB]"
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
        <p className="text-[12px] font-semibold text-[#0F172A]">
          Antwortentwurf
        </p>
        <div className="rounded-[16px] border border-[#CBD5E1]/50 bg-gradient-to-br from-[#F8FAFC] to-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
          <div className="mb-3 flex items-center gap-2 border-b border-[#CBD5E1]/30 pb-3">
            <HelpyAvatar size="sm" />
            <div>
              <p className="text-[11px] font-semibold text-[#0F172A]">HELPY</p>
              <p className="text-[10px] text-[#94A3B8]">Entwurf</p>
            </div>
          </div>
          <p className="whitespace-pre-line text-[12px] leading-[1.7] text-[#334155]">
            {result.antwortEntwurf}
          </p>
        </div>
      </div>
    </div>
  );
}

export function HelpyBrainLoadingView() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-[20px] border border-[#CBD5E1]/40 bg-[#F8FAFC]/80 p-8 text-center">
      <div className="relative">
        <HelpyAvatar size="md" />
        <Sparkles className="absolute -top-1 -right-1 size-4 animate-pulse text-[#2563EB]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#0F172A]">
          Ich analysiere die E-Mail…
        </p>
        <p className="mt-1.5 text-[12px] text-[#64748B]">
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
