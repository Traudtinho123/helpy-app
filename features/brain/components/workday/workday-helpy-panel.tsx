"use client";

import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpyPanelShell } from "@/components/helpy/helpy-panel-shell";
import { WorkdayHelpyMessages } from "@/features/brain/components/workday/workday-helpy-messages";
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
    <HelpyPanelShell variant="sidebar" showOnlineBadge>
      <div className="flex-1 overflow-y-auto px-1 pt-2">
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

      <div className="mt-5 space-y-3 px-1">
        <p className="helpy-label px-1 normal-case tracking-normal">
          Was soll ich als Nächstes tun?
        </p>
        <div className="helpy-glass-card rounded-[20px] p-2.5 transition-all duration-200 focus-within:shadow-[var(--button-primary-shadow)]">
          <textarea
            rows={2}
            placeholder="Frag HELPY…"
            className="w-full resize-none bg-transparent px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
          />
          <div className="flex items-center justify-between px-2 pb-1">
            <p className="text-[10px] font-medium text-[var(--text-muted)]">
              Eingabe zum Senden
            </p>
            <Button
              size="icon-sm"
              variant="primary"
              className="size-8 rounded-[8px]"
              aria-label="Nachricht senden"
            >
              <ArrowUp className="size-4" strokeWidth={2.5} />
            </Button>
          </div>
        </div>
      </div>
    </HelpyPanelShell>
  );
}
