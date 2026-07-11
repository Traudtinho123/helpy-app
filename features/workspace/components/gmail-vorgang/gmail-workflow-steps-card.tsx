"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGmailWorkspaceActions } from "@/features/workspace/components/gmail-vorgang/gmail-workspace-actions-context";
import {
  openAngebotPanel,
  openDokumentPanel,
  openKundePanel,
  openObjektPanel,
  openTerminPanel,
  openWorkspacePanelWithFallback,
} from "@/features/workspace/panels/workspace-panel-openers";
import {
  WORKFLOW_STEP_STATUS_LABELS,
  type GmailWorkflowActionKind,
  type GmailWorkflowStepVisualStatus,
  type ResolvedGmailWorkflowStep,
} from "@/features/workspace/services/gmail-workspace/gmail-workflow-steps";
import { useWorkspaceContext } from "@/features/workspace/context";
import { cn } from "@/lib/utils";

const STATUS_BADGE_STYLES: Record<GmailWorkflowStepVisualStatus, string> = {
  vorbereitet: "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]",
  "in-pruefung": "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
  bestaetigt: "border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]",
  erledigt: "border-[#CBD5E1] bg-[#F1F5F9] text-[#475569]",
};

function scrollToAnchor(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function executeWorkflowStepAction(
  step: ResolvedGmailWorkflowStep,
  vorgangId: string,
  router: ReturnType<typeof useRouter>,
  actions: ReturnType<typeof useGmailWorkspaceActions>
): void {
  if (step.incomplete) {
    switch (step.actionKind) {
      case "kundenakte":
      case "antwort":
        scrollToAnchor("workspace-interessent");
        return;
      case "objekt":
      case "expose":
        scrollToAnchor("workspace-objekt");
        return;
      case "termin":
      case "erstgespraech":
        scrollToAnchor("workspace-besichtigung");
        return;
      case "checkliste":
      case "offerte":
      case "materialliste":
      case "frist":
      case "dokument":
        scrollToAnchor("workspace-vorbereitet");
        return;
      default:
        scrollToAnchor("workspace-vorbereitet");
        return;
    }
  }

  const navigate = (path: string) => router.push(path);

  const actionHandlers: Record<GmailWorkflowActionKind, () => void> = {
    kundenakte: () =>
      openWorkspacePanelWithFallback(openKundePanel({ vorgangId }), navigate),
    objekt: () =>
      openWorkspacePanelWithFallback(openObjektPanel({ vorgangId }), navigate),
    termin: () => {
      actions?.triggerAppointmentReview();
      openWorkspacePanelWithFallback(openTerminPanel({ vorgangId }), navigate);
    },
    expose: () =>
      openWorkspacePanelWithFallback(
        openDokumentPanel({ vorgangId, focus: "expose" }),
        navigate
      ),
    antwort: () => {
      actions?.triggerReplyReview();
      scrollToAnchor("workspace-vorbereitet");
    },
    checkliste: () => scrollToAnchor("workspace-vorbereitet"),
    offerte: () =>
      openWorkspacePanelWithFallback(
        openAngebotPanel({ vorgangId }),
        navigate
      ),
    materialliste: () =>
      openWorkspacePanelWithFallback(
        openDokumentPanel({ vorgangId, focus: "dokument" }),
        navigate
      ),
    frist: () =>
      openWorkspacePanelWithFallback(
        openDokumentPanel({ vorgangId, focus: "dokument" }),
        navigate
      ),
    dokument: () =>
      openWorkspacePanelWithFallback(
        openDokumentPanel({ vorgangId, focus: "dokument" }),
        navigate
      ),
    erstgespraech: () => {
      actions?.triggerAppointmentReview();
      openWorkspacePanelWithFallback(openTerminPanel({ vorgangId }), navigate);
    },
  };

  actionHandlers[step.actionKind]();
}

export function GmailWorkflowStepsCard() {
  const { workspaceId, currentWorkflow } = useWorkspaceContext();
  const router = useRouter();
  const actions = useGmailWorkspaceActions();
  const [expanded, setExpanded] = useState(false);
  const steps = currentWorkflow.steps;

  const handleStepAction = useCallback(
    (step: ResolvedGmailWorkflowStep) => {
      executeWorkflowStepAction(step, workspaceId, router, actions);
    },
    [actions, router, workspaceId]
  );

  if (steps.length === 0) {
    return null;
  }

  const preparedCount = steps.filter(
    (step) => step.status === "vorbereitet" || step.status === "in-pruefung"
  ).length;

  return (
    <Card
      id="helpy-gmail-arbeitsablauf"
      className="scroll-mt-6 rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04)] backdrop-blur-xl"
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center gap-3 border-b border-[#CBD5E1]/30 px-5 py-4 text-left"
        aria-expanded={expanded}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-[#EFF6FF] text-[#2563EB]">
          <ListChecks className="size-4" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold tracking-[-0.01em] text-[#0F172A]">
            Workflow
          </p>
          <p className="text-[12px] text-[#64748B]">
            HELPY hat die nächsten Schritte vorbereitet.
            {!expanded && preparedCount > 0 && (
              <span className="text-[#94A3B8]">
                {" "}
                · {preparedCount} offen
              </span>
            )}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-[#94A3B8] transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <CardContent className="px-5 py-4">
          <ul className="space-y-2">
            {steps.map((step) => (
              <li
                key={step.id}
                className={cn(
                  "rounded-[14px] border px-3.5 py-3",
                  step.status === "erledigt" || step.status === "bestaetigt"
                    ? "border-[#E2E8F0]/80 bg-[#F8FAFC]/80"
                    : "border-[#E2E8F0]/70 bg-white/80"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-semibold text-[#0F172A]">
                        {step.title}
                      </p>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          STATUS_BADGE_STYLES[step.status]
                        )}
                      >
                        {WORKFLOW_STEP_STATUS_LABELS[step.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#64748B]">
                      {step.description}
                    </p>
                  </div>
                  {step.status !== "erledigt" && step.status !== "bestaetigt" && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleStepAction(step)}
                      className="h-8 shrink-0 rounded-[10px] bg-[#2563EB] px-3 text-[11px] font-semibold text-white hover:bg-[#1D4ED8]"
                    >
                      {step.buttonLabel}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
