import type { DecisionRuleOutcome } from "@/features/workspace/services/decision/decision-rules";
import type {
  DecisionAction,
  DecisionContext,
  DecisionDocument,
  DecisionResult,
} from "@/features/workspace/services/decision/decision-types";

export function buildDecisionResult(
  context: DecisionContext,
  outcome: DecisionRuleOutcome,
  overrides?: Partial<Pick<DecisionResult, "entscheidungSummary" | "warum">>
): DecisionResult {
  const dokumente: DecisionDocument[] = outcome.dokumentNames.map(
    (name, index) => ({
      id: `doc-${context.vorgangId}-${index + 1}`,
      name,
      typ: "PDF",
      status: context.hasDokumente && index === 0 ? "vorhanden" : "vorbereitet",
    })
  );

  const aktionen: DecisionAction[] = outcome.aktionLabels.map(
    (label, index) => ({
      id: `act-${context.vorgangId}-${index + 1}`,
      label,
      beschreibung: `Vorbereitet für ${context.kunde}.`,
    })
  );

  return {
    id: `dec-${context.vorgangId}`,
    vorgangId: context.vorgangId,
    entscheidungSummary:
      overrides?.entscheidungSummary ?? outcome.entscheidungSummary,
    warum: overrides?.warum ?? outcome.warum,
    erkannt: context.erkanntePunkte.slice(0, 4),
    workflowName: outcome.workflowName,
    workflowTemplateId: outcome.workflowTemplateId,
    focusStepId: outcome.focusStepId,
    focusStepTitle: outcome.focusStepTitle,
    dokumente,
    aktionen,
    automatischVorbereiten: outcome.automatischVorbereiten,
    benoetigtBestaetigung: outcome.benoetigtBestaetigung,
    createdAt: "2026-07-07T09:30:00+02:00",
  };
}

export function getDecisionPanelText(result: DecisionResult): {
  title: string;
  summary: string;
  nextFocus: string;
} {
  return {
    title: "Meine Entscheidung",
    summary: result.entscheidungSummary,
    nextFocus: result.focusStepTitle,
  };
}
