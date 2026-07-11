import { buildDecisionContext } from "@/features/workspace/services/decision/decision-context";
import { getMockDecisionOverride } from "@/features/workspace/services/decision/mock-decisions";
import { buildDecisionResult } from "@/features/workspace/services/decision/decision-result";
import { evaluateDecisionRules } from "@/features/workspace/services/decision/decision-rules";
import type {
  DecisionEvaluation,
  DecisionResult,
} from "@/features/workspace/services/decision/decision-types";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

const decisions = new Map<string, DecisionResult>();
const workflowOpened = new Set<string>();
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeDecision(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function evaluateDecision(vorgang: Vorgang): DecisionEvaluation {
  const context = buildDecisionContext(vorgang);
  const outcome = evaluateDecisionRules(context);
  const override = getMockDecisionOverride(vorgang.id);

  const result = buildDecisionResult(context, outcome, override);
  decisions.set(vorgang.id, result);

  return { context, result };
}

export function getDecisionForVorgang(vorgang: Vorgang): DecisionResult {
  const existing = decisions.get(vorgang.id);
  if (existing) return existing;
  return evaluateDecision(vorgang).result;
}

export function getDecisionEvaluation(vorgang: Vorgang): DecisionEvaluation {
  const existing = decisions.get(vorgang.id);
  if (existing) {
    return {
      context: buildDecisionContext(vorgang),
      result: existing,
    };
  }
  return evaluateDecision(vorgang);
}

export function isWorkflowOpenedForVorgang(vorgangId: string): boolean {
  return workflowOpened.has(vorgangId);
}

export function markWorkflowOpened(vorgangId: string): void {
  workflowOpened.add(vorgangId);
  notify();
}

export function resetDecisionStore(): void {
  decisions.clear();
  workflowOpened.clear();
  notify();
}
