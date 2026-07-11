"use client";

import { ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/Panel";
import { WorkdayHelpyMessages } from "@/features/brain/components/workday/workday-helpy-messages";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import type { IntakeFeedback, IntakeState } from "@/features/brain/services/intake";
import type { WorkflowEngineState } from "@/features/workflow/services/engine";
import type { WorkdaySummary } from "@/features/workday/services/workday-summary";

type WorkdayHelpyPanelProps = {
  intake: IntakeState;
  workflow: WorkflowEngineState;
  feedback: IntakeFeedback | null;
  openingMessage?: string | null;
  useMailSource?: boolean;
  workdaySummary?: WorkdaySummary | null;
  isMailLoading?: boolean;
};

export function WorkdayHelpyPanel({
  intake,
  workflow,
  feedback,
  openingMessage = null,
  useMailSource = false,
  workdaySummary = null,
  isMailLoading = false,
}: WorkdayHelpyPanelProps) {
  return (
    <Panel variant="sidebar">
      <PanelHeader className="px-5">
        <div className="flex items-center gap-3">
          <HelpyAvatar />
          <div>
            <h2 className="text-sm font-semibold tracking-[-0.01em] text-[#0F172A]">
              HELPY
            </h2>
            <p className="text-[11px] font-medium text-[#64748B]">
              Dein KI-Bürokollege
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="h-6 rounded-full border-[#A7F3D0] bg-[#ECFDF5] px-2.5 text-[10px] font-semibold text-[#047857]"
        >
          Online
        </Badge>
      </PanelHeader>

      <PanelBody className="overflow-y-visible py-0 pb-5">
        <div className="flex-1 overflow-y-auto px-1 pt-6">
          <WorkdayHelpyMessages
            intake={intake}
            workflow={workflow}
            feedback={feedback}
            openingMessage={openingMessage}
            useMailSource={useMailSource}
            workdaySummary={workdaySummary}
            isMailLoading={isMailLoading}
          />
        </div>

        <div className="mt-5 space-y-3">
          <p className="px-1 text-[12px] font-semibold tracking-[-0.01em] text-[#475569]">
            Was soll ich als Nächstes tun?
          </p>
          <div className="rounded-[24px] border border-[#CBD5E1]/50 bg-white p-2.5 shadow-[0_4px_32px_rgba(15,23,42,0.08)] transition-all duration-300 focus-within:border-[#2563EB]/30 focus-within:shadow-[0_8px_40px_rgba(37,99,235,0.12)]">
            <textarea
              rows={2}
              placeholder="Frag HELPY…"
              className="w-full resize-none bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed text-[#0F172A] placeholder:text-[#94A3B8] outline-none"
            />
            <div className="flex items-center justify-between px-2 pb-1">
              <p className="text-[10px] font-medium text-[#94A3B8]">
                Eingabe zum Senden
              </p>
              <Button
                size="icon-sm"
                className="size-8 rounded-[12px] bg-[#2563EB] shadow-[0_4px_12px_rgba(37,99,235,0.35)] transition-all duration-300 hover:bg-[#1D4ED8] hover:shadow-[0_4px_16px_rgba(37,99,235,0.45)]"
                aria-label="Nachricht senden"
              >
                <ArrowUp className="size-4" strokeWidth={2.5} />
              </Button>
            </div>
          </div>
        </div>
      </PanelBody>
    </Panel>
  );
}
