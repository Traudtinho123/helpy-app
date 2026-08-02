"use client";

import { Lightbulb, Link2, AlertTriangle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HelpyPanelShell } from "@/components/helpy/helpy-panel-shell";
import type { IntegrationSummary } from "@/features/integration-manager/types/integration-types";

type HelpyIntegrationPanelProps = {
  summary: IntegrationSummary;
};

export function HelpyIntegrationPanel({ summary }: HelpyIntegrationPanelProps) {
  const next = summary.nextRecommended;

  return (
    <HelpyPanelShell
      variant="helpy"
      className="flex w-[380px]"
      subtitle="Plattformen-Assistent"
    >
      <div className="space-y-5 px-1">
          <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
            Ich überwache deine verbundenen Plattformen und prüfe, ob neue
            Vorgänge vorbereitet werden können.
          </p>

          <Card className="rounded-[20px] border-[var(--border)] bg-[var(--bg-surface)] py-0 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Link2 className="size-4 text-[var(--accent)]" strokeWidth={2} />
                  Verbundene Plattformen
                </span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {summary.connectedCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Sparkles className="size-4 text-[var(--accent)]" strokeWidth={2} />
                  Neue Ereignisse heute
                </span>
                <span className="font-semibold text-[var(--accent)]">
                  {summary.eventsTodayTotal}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <AlertTriangle
                    className="size-4 text-[#D97706]"
                    strokeWidth={2}
                  />
                  Plattformen mit Warnung
                </span>
                <span className="font-semibold text-[#B45309]">
                  {summary.warningCount}
                </span>
              </div>
            </CardContent>
          </Card>

          {next && (
            <Card className="rounded-[20px] border-[#FDE68A]/60 bg-[#FFFBEB]/50 py-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-2">
                  <Lightbulb className="size-4 text-[#D97706]" strokeWidth={2} />
                  <p className="text-[12px] font-semibold text-[#B45309]">
                    Nächste empfohlene Verbindung
                  </p>
                </div>
                <p className="mt-3 text-[13px] font-medium text-[var(--text-primary)]">
                  {next.emoji} {next.name}
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">
                  {next.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
    </HelpyPanelShell>
  );
}
