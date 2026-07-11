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
        <HelpyAvatar size="sm" />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-[11px] font-semibold text-[#64748B]">HELPY</p>

          {isLoading && (
            <>
              <div className="helpy-fade-in rounded-[20px] rounded-tl-[8px] border border-[#BFDBFE]/60 bg-[#EFF6FF]/80 px-5 py-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
                <p className="text-[13px] leading-[1.65] text-[#334155]">
                  {isMailLoading
                    ? "Ich prüfe deine E-Mail-Nachrichten…"
                    : getLoadingMessage(intake, workflow)}
                </p>
                {workflow.currentStepLabel && workflow.phase === "preparing" && (
                  <p className="mt-2 text-[12px] font-medium text-[#2563EB]">
                    {workflow.currentStepLabel}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 px-1">
                <Loader2 className="size-3.5 animate-spin text-[#2563EB]" />
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
            </>
          )}

          {isReady && (
            <div className="helpy-fade-in space-y-3">
              <div className="rounded-[20px] rounded-tl-[8px] border border-[#BFDBFE]/60 bg-gradient-to-br from-[#EFF6FF] to-white px-5 py-5 shadow-[0_4px_20px_rgba(37,99,235,0.1)]">
                <p className="text-[13px] leading-[1.65] text-[#334155]">
                  {panelIntro}
                </p>
              </div>

              {useMailSource && workdaySummary && (
                <>
                  <div className="rounded-[16px] border border-[#BFDBFE]/50 bg-[#EFF6FF]/50 px-4 py-3.5">
                    <p className="text-[12px] leading-relaxed text-[#334155]">
                      {workdaySummary.panelPriorityHint}
                    </p>
                  </div>
                  {workdaySummary.panelArchiveHint && (
                    <div className="rounded-[16px] border border-[#E2E8F0]/70 bg-[#F8FAFC]/80 px-4 py-3.5">
                      <p className="text-[12px] leading-relaxed text-[#64748B]">
                        {workdaySummary.panelArchiveHint}
                      </p>
                    </div>
                  )}
                  {hasOpenFollowUps && (
                    <div className="rounded-[16px] border border-[#BFDBFE]/50 bg-[#EFF6FF]/50 px-4 py-3.5">
                      <p className="text-[12px] leading-relaxed text-[#334155]">
                        {HELPY_FOLLOWUP_MONITORING_MESSAGE}
                      </p>
                    </div>
                  )}
                </>
              )}

              {primaryAction && (
                <Link
                  href={primaryAction.href}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(37,99,235,0.32)] transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] active:scale-[0.99]"
                >
                  {primaryAction.label}
                  <ArrowRight className="size-4" strokeWidth={2.25} />
                </Link>
              )}
            </div>
          )}

          {visibleDetections.length > 0 && isLoading && (
            <div className="rounded-[16px] border border-[#CBD5E1]/40 bg-white/90 p-4 shadow-sm">
              <ul className="space-y-2">
                {visibleDetections.map((detection) => (
                  <li
                    key={detection.id}
                    className="flex items-center gap-2.5 text-[12px] text-[#334155]"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#ECFDF5]">
                      <Check
                        className="size-3 text-[#059669]"
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
            <div className="helpy-fade-in rounded-[16px] border border-[#C4B5FD]/60 bg-[#F5F3FF]/80 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin text-[#7C3AED]" />
                <p className="text-[12px] font-medium text-[#5B21B6]">
                  {openingMessage}
                </p>
              </div>
            </div>
          )}

          {feedback && (
            <div className="helpy-fade-in rounded-[16px] border border-[#A7F3D0]/60 bg-[#ECFDF5]/80 px-4 py-3.5">
              <p className="text-[12px] leading-relaxed text-[#334155]">
                {feedback.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
