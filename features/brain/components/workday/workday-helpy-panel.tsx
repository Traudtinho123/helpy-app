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

function OnlineBadge() {
  return (
    <Badge
      variant="outline"
      className="h-6 gap-1.5 rounded-full border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[var(--success-light)] px-2.5 text-[10px] font-semibold text-[var(--success)]"
    >
      <span
        aria-hidden
        className="helpy-online-pulse size-1.5 rounded-full bg-[var(--success)]"
      />
      Online
    </Badge>
  );
}

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
          <HelpyAvatar size="lg" />
          <div>
            <h2 className="helpy-h2 text-sm">HELPY</h2>
            <p className="text-[11px] font-medium text-[var(--text-secondary)]">
              Dein KI-Bürokollege
            </p>
          </div>
        </div>
        <OnlineBadge />
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
      </PanelBody>
    </Panel>
  );
}
