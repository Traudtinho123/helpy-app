"use client";

import { Loader2, Sparkles } from "lucide-react";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import type { WorkflowEngineState } from "@/features/workflow/services/engine";
import { cn } from "@/lib/utils";

type HelpyWorkflowPanelProps = {
  workflow: WorkflowEngineState;
};

export function HelpyWorkflowPanel({ workflow }: HelpyWorkflowPanelProps) {
  const isActive =
    workflow.phase === "connecting" ||
    workflow.phase === "analyzing" ||
    workflow.phase === "preparing";
  const isReady = workflow.phase === "ready";

  if (workflow.phase === "idle") {
    return null;
  }

  return (
    <div className="helpy-fade-in space-y-4 border-t border-[#CBD5E1]/40 pt-5">
      <div className="flex gap-3.5">
        <HelpyAvatar size="sm" pose={isActive ? "typing" : "idle"} />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-[11px] font-semibold text-[#64748B]">
            HELPY · Workflow Engine
          </p>

          {isActive && (
            <>
              <div className="rounded-[20px] rounded-tl-[8px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/80 px-5 py-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
                <p className="text-[13px] leading-[1.65] text-[#334155]">
                  {workflow.panelMessage}
                </p>
                {workflow.currentStepLabel && (
                  <p className="mt-2 text-[12px] font-medium text-[#2563EB]">
                    Ich habe erkannt: {workflow.currentStepLabel}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 px-1">
                <Loader2 className="size-3.5 animate-spin text-[#2563EB]" />
                <p className="text-[11px] text-[#64748B]">
                  Vorarbeit wird erstellt…
                </p>
              </div>
            </>
          )}

          {isReady && (
            <div className="space-y-3">
              <div className="rounded-[20px] rounded-tl-[8px] border border-[#BFDBFE]/60 bg-gradient-to-br from-[#EFF6FF] to-white px-5 py-5 shadow-[0_4px_20px_rgba(37,99,235,0.1)]">
                <p className="text-[13px] leading-[1.65] text-[#334155]">
                  {workflow.panelMessage}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-[16px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/50 px-4 py-3.5"
                )}
              >
                <div className="flex items-start gap-2">
                  <Sparkles
                    className="mt-0.5 size-4 shrink-0 text-[#2563EB]"
                    strokeWidth={2}
                  />
                  <p className="text-[12px] font-semibold leading-relaxed text-[#2563EB]">
                    {workflow.panelRecommendation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
