"use client";

import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  WORKFLOW_STEP_STATUS_LABELS,
  type WorkflowStep,
} from "@/features/workflow/services/automation";
import { useWorkspaceFlow } from "@/features/workspace/components/workspace-flow-context";
import {
  HELPY_BUTTON_BEARBEITEN,
  HELPY_BUTTON_BESTAETIGEN,
  HELPY_BUTTON_PRUEFEN,
} from "@/features/review/services/safety";
import type { Vorgang } from "@/features/workspace/services/workspace/types";
import { cn } from "@/lib/utils";

type WorkspaceWorkflowCardProps = {
  vorgang: Vorgang;
};

function StepIcon({ step }: { step: WorkflowStep }) {
  if (step.completed || step.status === "bestaetigt" || step.status === "erledigt") {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#ECFDF5] text-[#047857]">
        <Check className="size-3.5" strokeWidth={2.5} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full border",
        step.status === "in-pruefung"
          ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
          : step.status === "vorbereitet"
            ? "border-[#BFDBFE] bg-[#F8FAFC] text-[#64748B]"
            : "border-[#E2E8F0] bg-white text-[#CBD5E1]"
      )}
    >
      <Circle className="size-2.5" fill="currentColor" strokeWidth={0} />
    </span>
  );
}

function StepRow({
  step,
  onAction,
}: {
  step: WorkflowStep;
  onAction: (stepId: string, action: "pruefen" | "bestaetigen") => void;
}) {
  const isDone =
    step.completed ||
    step.status === "bestaetigt" ||
    step.status === "erledigt";
  const canReview = step.status === "vorbereitet" && !isDone;
  const canConfirm = step.status === "in-pruefung" && !isDone;

  return (
    <li
      className={cn(
        "rounded-[16px] border px-4 py-3.5 transition-all duration-300",
        step.status === "in-pruefung"
          ? "border-[#BFDBFE]/70 bg-[#EFF6FF]/40"
          : isDone
            ? "border-[#A7F3D0]/50 bg-[#ECFDF5]/30"
            : "border-[#E2E8F0]/70 bg-white/80"
      )}
    >
      <div className="flex items-start gap-3">
        <StepIcon step={step} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-semibold text-[#0F172A]">{step.title}</p>
            <span className="text-[10px] font-medium text-[#94A3B8]">
              {WORKFLOW_STEP_STATUS_LABELS[step.status]}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-[#64748B]">
            {step.description}
          </p>
          {(canReview || canConfirm) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {canReview && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onAction(step.id, "pruefen")}
                  className="h-8 rounded-[10px] bg-[#2563EB] px-3 text-[11px] font-semibold text-white hover:bg-[#1D4ED8]"
                >
                  {HELPY_BUTTON_PRUEFEN}
                </Button>
              )}
              {canConfirm && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onAction(step.id, "bestaetigen")}
                    className="h-8 rounded-[10px] bg-[#2563EB] px-3 text-[11px] font-semibold text-white hover:bg-[#1D4ED8]"
                  >
                    {HELPY_BUTTON_BESTAETIGEN}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-[10px] border-[#CBD5E1]/60 px-3 text-[11px] font-medium"
                  >
                    {HELPY_BUTTON_BEARBEITEN}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export function WorkspaceWorkflowCard(_props: WorkspaceWorkflowCardProps) {
  const { opened, instance, feedback, handleStepAction } =
    useWorkspaceFlow();

  if (!opened || !instance) {
    return null;
  }

  return (
    <Card
      id="helpy-arbeitsablauf"
      className="scroll-mt-6 rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04)] backdrop-blur-xl"
    >
      <CardHeader className="border-b border-[#CBD5E1]/30 px-5 py-4">
        <CardTitle className="text-[14px] font-semibold tracking-[-0.01em] text-[#0F172A]">
          Arbeitsablauf
        </CardTitle>
        <p className="text-[12px] text-[#64748B]">{instance.name}</p>
      </CardHeader>
      <CardContent className="px-5 py-4">
        {feedback && (
          <p className="mb-4 rounded-[12px] border border-[#A7F3D0]/50 bg-[#ECFDF5]/60 px-3.5 py-2.5 text-[11px] leading-relaxed text-[#047857]">
            {feedback}
          </p>
        )}
        <ul className="space-y-2.5">
          {instance.steps.map((step) => (
            <StepRow key={step.id} step={step} onAction={handleStepAction} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
