"use client";

import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { HelpyAvatar } from "@/components/helpy/helpy-avatar";
import type { IntakeFeedback, IntakeState } from "@/features/brain/services/intake";
import type { WorkflowEngineState } from "@/features/workflow/services/engine";
import {
  getGmailAutoSyncServerSnapshot,
  getGmailAutoSyncState,
  subscribeGmailAutoSyncPanel,
} from "@/features/gmail/services/gmail-auto-sync";
import type { WorkdaySummary } from "@/features/workday/services/workday-summary";
import { HELPY_FOLLOWUP_MONITORING_MESSAGE } from "@/features/followup/services/followup-engine";
import { useOpenFollowUps } from "@/features/followup/hooks/use-followup";
import { useExternalStore } from "@/lib/hooks/use-external-store";

const READY_MESSAGE =
  "Ich habe neue Eingänge geprüft und daraus vorbereitete Vorgänge erstellt. Du musst nur noch prüfen und bestätigen.";

type WorkdayHelpyMessagesProps = {
  intake: IntakeState;
  workflow: WorkflowEngineState;
  feedback: IntakeFeedback | null;
  openingMessage: string | null;
  useMailSource?: boolean;
  workdaySummary?: WorkdaySummary | null;
  isMailLoading?: boolean;
};

function getPrimaryVorgangAction(workflow: WorkflowEngineState): {
  label: string;
  href: string;
} | null {
  const prepared = workflow.results.filter(
    (result) => result.status === "vorbereitet"
  );

  if (prepared.length === 0) return null;

  const offerWorkflow = prepared.find(
    (result) => result.trigger.triggerType === "offertanfrage"
  );
  const primary = offerWorkflow ?? prepared[0];

  if (prepared.length > 1) {
    return {
      label: "Ersten Vorgang prüfen",
      href: prepared[0].vorgang.href,
    };
  }

  if (primary.trigger.triggerType === "offertanfrage") {
    return {
      label: "Angebot prüfen",
      href: primary.vorgang.href,
    };
  }

  return {
    label: "Vorgang prüfen",
    href: primary.vorgang.href,
  };
}

function getLoadingMessage(
  intake: IntakeState,
  workflow: WorkflowEngineState
): string {
  if (
    workflow.phase === "connecting" ||
    workflow.phase === "analyzing" ||
    intake.phase === "detecting"
  ) {
    return "Ich prüfe neue Eingänge…";
  }

  if (
    workflow.phase === "preparing" ||
    intake.phase === "waiting" ||
    intake.phase === "processing"
  ) {
    return "Ich bereite Vorgänge vor…";
  }

  if (intake.phase === "monitoring") {
    return "Ich starte die Prüfung neuer Eingänge…";
  }

  return intake.panelMessage;
}

export function WorkdayHelpyMessages({
  intake,
  workflow,
  feedback,
  openingMessage,
  useMailSource = false,
  workdaySummary = null,
  isMailLoading = false,
}: WorkdayHelpyMessagesProps) {
  const autoSyncState = useExternalStore(
    subscribeGmailAutoSyncPanel,
    getGmailAutoSyncState,
    getGmailAutoSyncServerSnapshot
  );

  const { hasOpenFollowUps } = useOpenFollowUps();

  const intakeActive =
    !useMailSource &&
    (intake.phase === "detecting" ||
      intake.phase === "waiting" ||
      intake.phase === "processing" ||
      intake.phase === "monitoring");

  const workflowActive =
    !useMailSource &&
    (workflow.phase === "connecting" ||
      workflow.phase === "analyzing" ||
      workflow.phase === "preparing");

  const isLoading = isMailLoading || intakeActive || workflowActive;
  const isReady =
    useMailSource && workdaySummary
      ? !isMailLoading
      : workflow.phase === "ready" && intake.phase === "ready";
  const primaryAction =
    isReady && !useMailSource ? getPrimaryVorgangAction(workflow) : null;

  const visibleDetections = intake.detections.filter((detection) =>
    intake.visibleDetectionIds.includes(detection.id)
  );

  const panelIntro =
    useMailSource && workdaySummary
      ? workdaySummary.panelIntro
      : useMailSource && autoSyncState.panelMessage
        ? autoSyncState.panelMessage
        : READY_MESSAGE;

  return (
    <div className="space-y-4">
      <div className="flex gap-3.5">
        <HelpyAvatar size="sm" pose="typing" />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="helpy-label normal-case tracking-normal">HELPY</p>

          {isLoading && (
            <>
              <div className="helpy-fade-in-slide helpy-chat-bubble-system rounded-[20px] rounded-tl-[8px] px-5 py-4">
                <p className="text-[13px] leading-[1.65] text-[var(--text-secondary)]">
                  {isMailLoading
                    ? "Ich prüfe deine E-Mail-Nachrichten…"
                    : getLoadingMessage(intake, workflow)}
                </p>
                {workflow.currentStepLabel && workflow.phase === "preparing" && (
                  <p className="mt-2 text-[12px] font-medium text-[var(--primary)]">
                    {workflow.currentStepLabel}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 px-1">
                <Loader2 className="size-3.5 animate-spin text-[var(--primary)]" />
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="helpy-pulse-dot size-1.5 rounded-full bg-[var(--primary)]"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {isReady && (
            <div className="helpy-fade-in-slide space-y-3">
              <div className="helpy-chat-bubble rounded-[20px] rounded-tl-[8px] px-5 py-5">
                <p className="text-[13px] leading-[1.65] text-[var(--text-secondary)]">
                  {panelIntro}
                </p>
              </div>

              {useMailSource && workdaySummary && (
                <>
                  <div className="helpy-fade-in-slide helpy-chat-bubble-system rounded-[16px] px-4 py-3.5">
                    <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
                      {workdaySummary.panelPriorityHint}
                    </p>
                  </div>
                  {workdaySummary.panelArchiveHint && (
                    <div className="helpy-fade-in-slide helpy-chat-bubble rounded-[16px] px-4 py-3.5">
                      <p className="text-[12px] leading-relaxed text-[var(--text-muted)]">
                        {workdaySummary.panelArchiveHint}
                      </p>
                    </div>
                  )}
                  {hasOpenFollowUps && (
                    <div className="helpy-fade-in-slide helpy-chat-bubble-system rounded-[16px] px-4 py-3.5">
                      <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
                        {HELPY_FOLLOWUP_MONITORING_MESSAGE}
                      </p>
                    </div>
                  )}
                </>
              )}

              {primaryAction && (
                <Link
                  href={primaryAction.href}
                  className="helpy-btn-primary inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] text-[13px]"
                >
                  {primaryAction.label}
                  <ArrowRight className="size-4" strokeWidth={2.25} />
                </Link>
              )}
            </div>
          )}

          {visibleDetections.length > 0 && isLoading && (
            <div className="helpy-glass-card rounded-[16px] p-4">
              <ul className="space-y-2">
                {visibleDetections.map((detection) => (
                  <li
                    key={detection.id}
                    className="helpy-fade-in-slide flex items-center gap-2.5 text-[12px] text-[var(--text-secondary)]"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--success-light)]">
                      <Check
                        className="size-3 text-[var(--success)]"
                        strokeWidth={2.5}
                      />
                    </span>
                    {detection.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {openingMessage && (
            <div className="helpy-fade-in-slide helpy-chat-bubble-system rounded-[16px] px-4 py-3.5">
              <div className="flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin text-[var(--primary)]" />
                <p className="text-[12px] font-medium text-[var(--primary)]">
                  {openingMessage}
                </p>
              </div>
            </div>
          )}

          {feedback && (
            <div className="helpy-fade-in-slide rounded-[16px] border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[var(--success-light)] px-4 py-3.5">
              <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
                {feedback.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
