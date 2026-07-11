import {
  ensureWorkflowForInput,
  ensureWorkflowFromDecision,
  getWorkflowInstance,
  getWorkflowPanelSummary,
} from "@/features/workflow/services/automation/workflow-engine";
import {
  getDecisionForVorgang,
  markWorkflowOpened,
} from "@/features/workspace/services/decision";
import { selectWorkflowTemplate } from "@/features/workflow/services/automation/workflow-rules";
import type {
  ResolveWorkflowInput,
  WorkflowInstance,
  WorkflowPanelSummary,
} from "@/features/workflow/services/automation/workflow-types";
import { getListeVorgang } from "@/features/workspace/services/workspace/workspace-engine";
import type { Vorgang } from "@/features/workspace/services/workspace/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

function buildResolveInput(vorgang: Vorgang): ResolveWorkflowInput {
  const liste = getListeVorgang(vorgang.id);

  return {
    vorgangId: vorgang.id,
    skill: vorgang.skill,
    intent: liste?.intent,
    typ: liste?.typ,
    sourceEventId: liste?.sourceEventId,
    titel: vorgang.aufgabe.titel,
  };
}

/** Startet den Arbeitsablauf für einen geöffneten Workspace-Vorgang. */
export function runWorkflowForVorgang(vorgang: Vorgang): WorkflowInstance {
  return openWorkflowFromDecision(vorgang);
}

export function openWorkflowFromDecision(vorgang: Vorgang): WorkflowInstance {
  const decision = getDecisionForVorgang(vorgang);
  markWorkflowOpened(vorgang.id);

  return ensureWorkflowFromDecision(
    buildResolveInput(vorgang),
    decision.workflowTemplateId,
    decision.focusStepId
  );
}

export function getWorkflowForVorgang(vorgang: Vorgang): WorkflowInstance | null {
  return getWorkflowInstance(vorgang.id);
}

export function getWorkflowPanelForVorgang(
  vorgang: Vorgang
): WorkflowPanelSummary | null {
  const instance = getWorkflowInstance(vorgang.id);
  if (!instance) return null;
  return getWorkflowPanelSummary(instance);
}

export function previewTemplateForSkill(skill: HelpySkill) {
  return selectWorkflowTemplate({ vorgangId: "preview", skill });
}

export function runWorkflowFromEventInput(
  input: ResolveWorkflowInput
): WorkflowInstance {
  return ensureWorkflowForInput(input);
}
