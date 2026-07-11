"use client";

import { Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { IntakePhase } from "@/features/brain/services/intake";
import { cn } from "@/lib/utils";

type HelpyMonitoringStatusProps = {
  phase: IntakePhase;
};

export function HelpyMonitoringStatus({ phase }: HelpyMonitoringStatusProps) {
  const isDetecting = phase === "detecting" || phase === "waiting" || phase === "processing";

  return (
    <Card className="relative overflow-hidden rounded-[24px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-white backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#2563EB]/8 to-transparent" />
      <CardContent className="relative p-7 lg:p-8">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#0F172A] to-[#1E3A5F] shadow-[0_4px_20px_rgba(15,23,42,0.25)]",
              isDetecting && "animate-pulse"
            )}
          >
            <Shield className="size-5 text-white" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[1.25rem] font-semibold tracking-[-0.02em] text-[#0F172A]">
              HELPY überwacht deinen Arbeitstag
            </h2>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[15px] leading-none">🟢</span>
              <span className="text-[13px] font-semibold text-[#047857]">
                Aktiv
              </span>
              {isDetecting && (
                <span className="rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-0.5 text-[10px] font-semibold text-[#2563EB]">
                  Erkennung läuft
                </span>
              )}
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-[#64748B]">
              Ich überwache deine wichtigsten Arbeitsbereiche und bereite neue
              Vorgänge vor — du prüfst und bestätigst.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
