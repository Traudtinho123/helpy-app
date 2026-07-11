"use client";

import { Lightbulb, Link2, AlertTriangle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import type { IntegrationSummary } from "@/features/integration-manager/types/integration-types";

type HelpyIntegrationPanelProps = {
  summary: IntegrationSummary;
};

export function HelpyIntegrationPanel({ summary }: HelpyIntegrationPanelProps) {
  const next = summary.nextRecommended;

  return (
    <Panel variant="helpy" className="flex w-[380px]">
      <PanelHeader className="h-auto items-start py-5">
        <div className="flex items-center gap-3">
          <HelpyAvatar />
          <div>
            <h2 className="text-sm font-semibold tracking-[-0.01em] text-[#0F172A]">
              HELPY
            </h2>
            <p className="text-[11px] font-medium text-[#64748B]">
              Plattformen-Assistent
            </p>
          </div>
        </div>
      </PanelHeader>

      <PanelBody>
        <div className="space-y-5">
          <p className="text-[13px] leading-relaxed text-[#334155]">
            Ich überwache deine verbundenen Plattformen und prüfe, ob neue
            Vorgänge vorbereitet werden können.
          </p>

          <Card className="rounded-[20px] border-[#CBD5E1]/40 bg-white py-0 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2 text-[#64748B]">
                  <Link2 className="size-4 text-[#2563EB]" strokeWidth={2} />
                  Verbundene Plattformen
                </span>
                <span className="font-semibold text-[#0F172A]">
                  {summary.connectedCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2 text-[#64748B]">
                  <Sparkles className="size-4 text-[#2563EB]" strokeWidth={2} />
                  Neue Ereignisse heute
                </span>
                <span className="font-semibold text-[#2563EB]">
                  {summary.eventsTodayTotal}
                </span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2 text-[#64748B]">
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
                <p className="mt-3 text-[13px] font-medium text-[#0F172A]">
                  {next.emoji} {next.name}
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">
                  {next.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </PanelBody>
    </Panel>
  );
}
