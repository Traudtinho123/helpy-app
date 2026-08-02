"use client";

import Link from "next/link";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  WorkflowEngineState,
  WorkflowResult,
  WorkflowResultActionType,
} from "@/features/workflow/services/engine";
import { cn } from "@/lib/utils";

type PreparedWorkflowsSectionProps = {
  workflow: WorkflowEngineState;
  onAction?: (workflowId: string, action: WorkflowResultActionType) => void;
  actionFeedback?: string | null;
};

function PreparedWorkflowCard({
  result,
  onAction,
  isProcessing,
}: {
  result: WorkflowResult;
  onAction?: (workflowId: string, action: WorkflowResultActionType) => void;
  isProcessing?: boolean;
}) {
  const isDone = result.status === "erledigt";

  return (
    <article
      className={cn(
        "helpy-fade-in rounded-[20px] border px-5 py-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)] backdrop-blur-xl transition-all duration-500",
        isDone
          ? "border-[#A7F3D0]/70 bg-[#ECFDF5]/40"
          : "border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--border-accent)] hover:shadow-[0_8px_24px_rgba(37,99,235,0.08)]"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]/80 text-[22px] shadow-[0_4px_12px_rgba(37,99,235,0.12)]">
          {isDone ? (
            <CheckCircle2 className="size-5 text-[#047857]" strokeWidth={2.25} />
          ) : (
            <span>{result.emoji}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            {result.titel}
          </h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            {result.zusammenfassung}
          </p>
          <p className="mt-2 text-[11px] font-medium text-[var(--accent)]">
            {result.naechsterSchritt}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {result.actions.map((action) => {
              const isMarkDone = action.type === "als_erledigt";

              if (isMarkDone) {
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    disabled={isDone || isProcessing}
                    onClick={() => onAction?.(result.workflowId, action.type)}
                    className="h-8 rounded-[10px] border-[var(--border)] bg-[var(--bg-surface)] text-[12px] font-semibold text-[var(--text-secondary)] hover:border-[var(--border-accent)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)]"
                  >
                    {isProcessing ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      action.label
                    )}
                  </Button>
                );
              }

              if (action.href) {
                return (
                  <Link
                    key={action.id}
                    href={action.href}
                    onClick={() => onAction?.(result.workflowId, action.type)}
                    className="inline-flex h-8 items-center justify-center rounded-[10px] bg-[#2563EB] px-3.5 text-[12px] font-semibold text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)] transition-all hover:bg-[#1D4ED8]"
                  >
                    {action.label}
                  </Link>
                );
              }

              return null;
            })}
          </div>
        </div>
      </div>
    </article>
  );
}

export function PreparedWorkflowsSection({
  workflow,
  onAction,
  actionFeedback,
}: PreparedWorkflowsSectionProps) {
  const visibleResults = workflow.results.filter((result) =>
    workflow.visibleResultIds.includes(result.workflowId)
  );

  const isActive =
    workflow.phase === "connecting" ||
    workflow.phase === "analyzing" ||
    workflow.phase === "preparing";

  if (workflow.phase === "idle" && visibleResults.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-[1.375rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Von HELPY vorbereitet
        </h2>
        <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
          {isActive
            ? "HELPY bereitet Vorarbeit aus neuen Eingängen vor — bitte prüfen und bestätigen."
            : "Von HELPY vorbereitet – bitte prüfen und bestätigen."}
        </p>
      </div>

      <Card className="relative overflow-hidden rounded-[24px] border-[var(--border)] bg-[var(--bg-surface)] py-0 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_12px_40px_rgba(15,23,42,0.06)] ring-1 ring-white backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#2563EB]/8 to-transparent" />
        <CardContent className="relative space-y-4 p-7 lg:p-8">
          {isActive && (
            <div className="helpy-fade-in flex items-center gap-3 rounded-[16px] border border-[var(--border-accent)] bg-[var(--accent-light)] px-4 py-3.5">
              <Loader2 className="size-4 shrink-0 animate-spin text-[var(--accent)]" />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[var(--text-primary)]">
                  {workflow.panelMessage}
                </p>
                {workflow.currentStepLabel && (
                  <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                    {workflow.currentStepLabel}
                  </p>
                )}
              </div>
            </div>
          )}

          {workflow.phase === "ready" && workflow.panelRecommendation && (
            <div className="helpy-fade-in flex items-start gap-3 rounded-[16px] border border-[var(--border-accent)]/50 bg-[var(--accent-light)]/50 px-4 py-3.5">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
              <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
                {workflow.panelRecommendation}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {visibleResults.map((result) => (
              <PreparedWorkflowCard key={result.workflowId} result={result} onAction={onAction} />
            ))}
          </div>

          {actionFeedback && (
            <div className="helpy-fade-in rounded-[14px] border border-[#A7F3D0]/60 bg-[#ECFDF5]/80 px-4 py-3">
              <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
                {actionFeedback}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
