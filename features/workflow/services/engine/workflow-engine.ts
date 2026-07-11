import { MOCK_WORKFLOW_TRIGGERS } from "@/features/workflow/services/engine/mock-workflows";
import {
  createInitialWorkflowState,
  markWorkflowResultDone,
  markWorkflowResultInProgress,
  runWorkflowPreparation,
} from "@/features/workflow/services/engine/workflow-runner";
import type {
  WorkflowEngineOptions,
  WorkflowEngineState,
  WorkflowResult,
  WorkflowTriggerEvent,
} from "@/features/workflow/services/engine/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export {
  createInitialWorkflowState,
  markWorkflowResultDone,
  markWorkflowResultInProgress,
};

export function getMockWorkflowTriggers(skill?: HelpySkill): WorkflowTriggerEvent[] {
  if (!skill) return MOCK_WORKFLOW_TRIGGERS;
  return MOCK_WORKFLOW_TRIGGERS.filter((trigger) => trigger.skill === skill);
}

export async function runWorkflowEngine(
  options?: WorkflowEngineOptions
): Promise<WorkflowEngineState> {
  const triggers = getMockWorkflowTriggers(options?.skill);

  return runWorkflowPreparation(triggers, {
    stepDelayMs: options?.stepDelayMs,
    resultRevealDelayMs: options?.resultRevealDelayMs,
    onUpdate: options?.onUpdate,
  });
}

export function getVisibleWorkflowResults(
  state: WorkflowEngineState
): WorkflowResult[] {
  return state.results.filter((result) =>
    state.visibleResultIds.includes(result.workflowId)
  );
}

export function getPreparedWorkflowCount(state: WorkflowEngineState): number {
  return state.results.filter((result) => result.status === "vorbereitet").length;
}
