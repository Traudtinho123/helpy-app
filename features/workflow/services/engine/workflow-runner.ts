import {
  buildCreatedObjects,
  buildPreparedActions,
  getWorkflowStep,
} from "@/features/workflow/services/engine/workflow-actions";
import { WORKFLOW_REGISTRY } from "@/features/workflow/services/engine/workflow-registry";
import type {
  WorkflowDefinition,
  WorkflowEngineState,
  WorkflowKunde,
  WorkflowResult,
  WorkflowRunnerOptions,
  WorkflowTriggerEvent,
} from "@/features/workflow/services/engine/types";
import { getVorgangPath } from "@/features/workspace/services/workspace/mock-vorgaenge";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildKundeFromTrigger(trigger: WorkflowTriggerEvent): WorkflowKunde {
  const [ansprechpartner, ...rest] = trigger.absender.split(" · ");
  const firma = rest.join(" · ") || ansprechpartner;

  return {
    name: firma,
    ansprechpartner: ansprechpartner.trim(),
    status: "neu",
  };
}

export function buildWorkflowResult(
  definition: WorkflowDefinition,
  trigger: WorkflowTriggerEvent
): WorkflowResult {
  return {
    workflowId: definition.id,
    skill: definition.skill,
    trigger,
    kunde: buildKundeFromTrigger(trigger),
    vorgang: {
      id: definition.vorgangId,
      titel: definition.vorgangTitel,
      href: getVorgangPath(definition.vorgangId),
    },
    vorbereiteteAktionen: buildPreparedActions(definition.steps),
    erstellteObjekte: buildCreatedObjects(definition.steps),
    naechsterSchritt: definition.naechsterSchritt,
    helpyNachricht: definition.helpyNachricht,
    status: "vorbereitet",
    titel: definition.resultTitel,
    emoji: definition.resultEmoji,
    zusammenfassung: definition.resultZusammenfassung,
    actions: definition.actions.map((action) => ({ ...action })),
  };
}

export function createInitialWorkflowState(): WorkflowEngineState {
  return {
    phase: "idle",
    visibleResultIds: [],
    results: [],
    currentStepLabel: "",
    panelMessage: "Ich prüfe neue Eingänge…",
    panelRecommendation: "",
  };
}

export async function runWorkflowPreparation(
  triggers: WorkflowTriggerEvent[],
  options?: WorkflowRunnerOptions
): Promise<WorkflowEngineState> {
  const stepDelayMs = options?.stepDelayMs ?? 320;
  const resultRevealDelayMs = options?.resultRevealDelayMs ?? 400;
  const results: WorkflowResult[] = [];
  const visibleResultIds: string[] = [];

  const emit = (state: WorkflowEngineState) => {
    options?.onUpdate?.(state);
  };

  emit({
    phase: "connecting",
    visibleResultIds: [],
    results: [],
    currentStepLabel: "",
    panelMessage: "Ich prüfe neue Eingänge…",
    panelRecommendation: "",
  });

  await delay(stepDelayMs * 2);

  emit({
    phase: "analyzing",
    visibleResultIds: [],
    results: [],
    currentStepLabel: "",
    panelMessage: "Ich erkenne, was wichtig ist…",
    panelRecommendation: "",
  });

  await delay(stepDelayMs * 2);

  emit({
    phase: "preparing",
    visibleResultIds: [],
    results: [],
    currentStepLabel: "",
    panelMessage: "Ich bereite Vorgänge vor…",
    panelRecommendation: "",
  });

  for (const trigger of triggers) {
    const definition = WORKFLOW_REGISTRY.find(
      (workflow) => workflow.triggerType === trigger.triggerType
    );

    if (!definition) continue;

    for (const stepId of definition.steps) {
      const step = getWorkflowStep(stepId);

      emit({
        phase: "preparing",
        visibleResultIds: [...visibleResultIds],
        results: [...results],
        currentStepLabel: step.label,
        panelMessage: `Ich habe vorbereitet: ${step.label}`,
        panelRecommendation: "",
      });

      await delay(stepDelayMs);
    }

    const result = buildWorkflowResult(definition, trigger);
    results.push(result);
    visibleResultIds.push(result.workflowId);

    emit({
      phase: "preparing",
      visibleResultIds: [...visibleResultIds],
      results: [...results],
      currentStepLabel: "",
      panelMessage: `${result.emoji} ${result.titel}`,
      panelRecommendation: "",
    });

    await delay(resultRevealDelayMs);
  }

  const finalState: WorkflowEngineState = {
    phase: "ready",
    visibleResultIds: results.map((result) => result.workflowId),
    results,
    currentStepLabel: "",
    panelMessage:
      "Ich habe neue Eingänge geprüft und daraus vorbereitete Vorgänge erstellt. Du musst nur noch prüfen und bestätigen.",
    panelRecommendation: "",
  };

  emit(finalState);
  return finalState;
}

export function markWorkflowResultDone(
  results: WorkflowResult[],
  workflowId: string
): WorkflowResult[] {
  return results.map((result) =>
    result.workflowId === workflowId
      ? { ...result, status: "erledigt" }
      : result
  );
}

export function markWorkflowResultInProgress(
  results: WorkflowResult[],
  workflowId: string
): WorkflowResult[] {
  return results.map((result) =>
    result.workflowId === workflowId
      ? { ...result, status: "in_bearbeitung" }
      : result
  );
}
