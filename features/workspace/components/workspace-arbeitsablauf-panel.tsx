"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useWorkspaceFlow } from "@/features/workspace/components/workspace-flow-context";
import {
  getWorkflowPanelForVorgang,
  subscribeWorkflow,
} from "@/features/workflow/services/automation";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

type WorkspaceArbeitsablaufPanelProps = {
  vorgang: Vorgang;
};

export function WorkspaceArbeitsablaufPanel({
  vorgang,
}: WorkspaceArbeitsablaufPanelProps) {
  const { opened } = useWorkspaceFlow();
  const [, setWorkflowTick] = useState(0);

  useEffect(
    () => subscribeWorkflow(() => setWorkflowTick((tick) => tick + 1)),
    []
  );

  const summary = getWorkflowPanelForVorgang(vorgang);

  if (!opened || !summary) {
    return null;
  }

  const { progress } = summary;

  return (
    <Card className="mt-4 rounded-[20px] border-[var(--border)] bg-[var(--bg-surface)] py-0 shadow-sm backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[var(--accent)]" strokeWidth={2} />
          <p className="text-[12px] font-semibold text-[var(--text-primary)]">
            Aktueller Arbeitsablauf
          </p>
        </div>
        <p className="mt-3 text-[12px] leading-[1.65] text-[var(--text-secondary)]">
          {summary.intro}
        </p>

        <div className="mt-4 space-y-3">
          <div className="rounded-[14px] border border-[var(--border-accent)]/50 bg-[var(--accent-light)]/40 px-4 py-3">
            <p className="text-[10px] font-semibold tracking-[0.06em] text-[var(--accent)] uppercase">
              Nächster Schritt
            </p>
            <p className="mt-1.5 text-[12px] font-medium text-[var(--text-primary)]">
              {summary.nextStep}
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-[11px]">
              <span className="font-medium text-[var(--text-secondary)]">Fortschritt</span>
              <span className="font-semibold text-[var(--accent)]">
                {progress.progressLabel}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#E2E8F0]/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] transition-all duration-500"
                style={{
                  width: `${progress.totalCount ? (progress.preparedCount / progress.totalCount) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
