"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMemo } from "react";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";
import {
  getDecisionForVorgang,
  subscribeDecision,
} from "@/features/workspace/services/decision";
import { HELPY_DECISION_INTRO } from "@/features/review/services/safety";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

type WorkspaceDecisionPanelProps = {
  vorgang: Vorgang;
  onOpenWorkflow: () => void;
};

export function WorkspaceDecisionPanel({
  vorgang,
  onOpenWorkflow,
}: WorkspaceDecisionPanelProps) {
  const revision = useStoreRevision(subscribeDecision);
  const decision = useMemo(
    () => getDecisionForVorgang(vorgang),
    [vorgang, revision]
  );

  return (
    <Card className="mt-4 rounded-[20px] border-[#CBD5E1]/40 bg-white/90 py-0 shadow-sm backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[#2563EB]" strokeWidth={2} />
          <p className="text-[12px] font-semibold text-[#0F172A]">
            Meine Entscheidung
          </p>
        </div>

        <p className="mt-3 text-[12px] leading-[1.65] text-[#334155]">
          {HELPY_DECISION_INTRO}
        </p>

        <p className="mt-2 text-[12px] leading-[1.65] text-[#334155]">
          {decision.entscheidungSummary}
        </p>

        <div className="mt-4 rounded-[14px] border border-[#E2E8F0]/70 bg-[#F8FAFC]/60 px-4 py-3">
          <p className="text-[10px] font-semibold tracking-[0.06em] text-[#94A3B8] uppercase">
            Als Nächstes
          </p>
          <p className="mt-1.5 text-[12px] font-medium text-[#0F172A]">
            {decision.focusStepTitle}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#64748B]">
            {decision.workflowName}
          </p>
        </div>

        <Button
          type="button"
          onClick={onOpenWorkflow}
          className="mt-4 h-9 w-full rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[12px] font-semibold text-white shadow-sm hover:shadow-md"
        >
          Arbeitsablauf öffnen
        </Button>
      </CardContent>
    </Card>
  );
}
