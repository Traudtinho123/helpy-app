"use client";

import { useMemo } from "react";
import { HelpyPanelShell } from "@/components/helpy/helpy-panel-shell";
import { WorkdayHelpyMessages } from "@/features/brain/components/workday/workday-helpy-messages";
import { HelpyChatComposer } from "@/features/helpy-chat/components/helpy-chat-composer";
import { HelpyChatThread } from "@/features/helpy-chat/components/helpy-chat-thread";
import { useHelpyChat } from "@/features/helpy-chat/hooks/use-helpy-chat";
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
  const workdayHint = useMemo(() => {
    if (!workdaySummary) return undefined;
    const parts: string[] = [];
    if (workdaySummary.vorgaengePrepared > 0) {
      parts.push(`${workdaySummary.vorgaengePrepared} Vorgänge vorbereitet`);
    }
    if (workdaySummary.criticalCount > 0) {
      parts.push(`${workdaySummary.criticalCount} kritisch`);
    }
    if (workdaySummary.highPriorityCount > 0) {
      parts.push(`${workdaySummary.highPriorityCount} hohe Priorität`);
    }
    return parts.length > 0 ? parts.join(", ") : workdaySummary.summaryText;
  }, [workdaySummary]);

  const { messages, isSending, error, sendMessage } = useHelpyChat({
    context: {
      surface: "workday",
      workdayHint,
    },
  });

  return (
    <HelpyPanelShell variant="sidebar" showOnlineBadge>
      <div className="flex-1 space-y-4 overflow-y-auto px-1 pt-2">
        <WorkdayHelpyMessages
          intake={intake}
          workflow={workflow}
          feedback={feedback}
          openingMessage={openingMessage}
          useMailSource={useMailSource}
          workdaySummary={workdaySummary}
          isMailLoading={isMailLoading}
        />

        <HelpyChatThread
          messages={messages}
          isSending={isSending}
          error={error}
        />
      </div>

      <div className="mt-5 space-y-3 px-1">
        <p className="helpy-label px-1 normal-case tracking-normal">
          Was soll ich als Nächstes tun?
        </p>
        <HelpyChatComposer
          onSend={sendMessage}
          isSending={isSending}
          placeholder="Frag HELPY…"
          variant="glass"
        />
      </div>
    </HelpyPanelShell>
  );
}
