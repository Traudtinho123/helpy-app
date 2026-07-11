"use client";

import { useCallback, useMemo, useState } from "react";
import { useStoreRevision } from "@/lib/hooks/use-store-revision";
import {
  getDecisionForVorgang,
  isWorkflowOpenedForVorgang,
  subscribeDecision,
  type DecisionResult,
} from "@/features/workspace/services/decision";
import {
  confirmWorkflowStep,
  getWorkflowForVorgang,
  openWorkflowFromDecision,
  reviewWorkflowStep,
  subscribeWorkflow,
} from "@/features/workflow/services/automation";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

export function useWorkspaceWorkflow(vorgang: Vorgang) {
  const vorgangId = vorgang.id;

  const decisionRevision = useStoreRevision(subscribeDecision);
  const workflowRevision = useStoreRevision(subscribeWorkflow);

  const decision: DecisionResult = useMemo(
    () => getDecisionForVorgang(vorgang),
    [vorgang, decisionRevision]
  );

  const opened = useMemo(
    () => isWorkflowOpenedForVorgang(vorgangId),
    [vorgangId, decisionRevision]
  );

  const instance = useMemo(
    () => getWorkflowForVorgang(vorgang),
    [vorgang, workflowRevision]
  );

  const [feedback, setFeedback] = useState<string | null>(null);

  const openWorkflow = useCallback(() => {
    openWorkflowFromDecision(vorgang);
    const target = document.getElementById("helpy-arbeitsablauf");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [vorgang]);

  const handleStepAction = useCallback(
    (stepId: string, action: "pruefen" | "bestaetigen") => {
      if (!instance) return;

      const result =
        action === "pruefen"
          ? reviewWorkflowStep(vorgangId, stepId)
          : confirmWorkflowStep(vorgangId, stepId);

      if (result.success) {
        setFeedback(result.helpyMessage);
      }
    },
    [instance, vorgangId]
  );

  return useMemo(
    () => ({
      decision,
      opened,
      instance,
      feedback,
      openWorkflow,
      handleStepAction,
    }),
    [decision, opened, instance, feedback, openWorkflow, handleStepAction]
  );
}
