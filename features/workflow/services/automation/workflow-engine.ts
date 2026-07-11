import { HELPY_WORKFLOW_INTRO } from "@/features/review/services/safety/review-mode";
import { selectWorkflowTemplate } from "@/features/workflow/services/automation/workflow-rules";
import { getWorkflowTemplateById } from "@/features/workflow/services/automation/mock-workflows";
import { instantiateStepsFromTemplate } from "@/features/workflow/services/automation/workflow-template";
import type {
  ConfirmStepResult,
  ResolveWorkflowInput,
  WorkflowInstance,
  WorkflowPanelSummary,
  WorkflowProgress,
  WorkflowStep,
  WorkflowStepStatus,
  WorkflowTemplate,
} from "@/features/workflow/services/automation/workflow-types";

const instances = new Map<string, WorkflowInstance>();
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeWorkflow(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function applyDemoPreparedState(steps: WorkflowStep[]): WorkflowStep[] {
  return steps.map((step, index) => {
    if (index === 0) {
      return { ...step, status: "in-pruefung", completed: false };
    }
    if (index === 1) {
      return { ...step, status: "vorbereitet", completed: false };
    }
    return { ...step, status: "erkannt", completed: false };
  });
}

export function createWorkflowInstance(
  template: WorkflowTemplate,
  vorgangId: string
): WorkflowInstance {
  const steps = applyDemoPreparedState(instantiateStepsFromTemplate(template.steps));

  return {
    id: `wfi-${vorgangId}`,
    templateId: template.id,
    name: template.name,
    skill: template.skill,
    trigger: template.trigger,
    vorgangId,
    steps,
    createdAt: "2026-07-07T09:00:00+02:00",
  };
}

export function getWorkflowInstance(vorgangId: string): WorkflowInstance | null {
  return instances.get(vorgangId) ?? null;
}

export function saveWorkflowInstance(instance: WorkflowInstance): void {
  instances.set(instance.vorgangId, instance);
  notify();
}

function isStepReady(step: WorkflowStep, steps: WorkflowStep[]): boolean {
  if (step.dependsOn.length === 0) return true;
  return step.dependsOn.every((depId) => {
    const dep = steps.find((item) => item.id === depId);
    return dep?.completed === true;
  });
}

function activateNextSteps(steps: WorkflowStep[]): WorkflowStep[] {
  const next = steps.map((step) => ({ ...step }));

  for (const step of next) {
    if (step.completed) {
      step.status = step.status === "bestaetigt" ? "bestaetigt" : "erledigt";
      continue;
    }

    if (isStepReady(step, next) && step.status === "erkannt") {
      step.status = "vorbereitet";
    }
  }

  const openSteps = next.filter((step) => !step.completed);
  const hasInReview = openSteps.some((step) => step.status === "in-pruefung");

  if (!hasInReview) {
    const focus = openSteps.find(
      (step) => step.status === "vorbereitet" && isStepReady(step, next)
    );
    if (focus) {
      focus.status = "in-pruefung";
    }
  }

  return next;
}

export function computeWorkflowProgress(instance: WorkflowInstance): WorkflowProgress {
  const totalCount = instance.steps.length;
  const preparedCount = instance.steps.filter(
    (step) =>
      step.status === "vorbereitet" ||
      step.status === "in-pruefung" ||
      step.status === "bestaetigt" ||
      step.status === "erledigt"
  ).length;
  const completedCount = instance.steps.filter((step) => step.completed).length;

  const nextStep = instance.steps.find(
    (step) =>
      step.status === "in-pruefung" ||
      (step.status === "vorbereitet" && !step.completed)
  );

  return {
    preparedCount,
    totalCount,
    completedCount,
    nextStepTitle: nextStep?.title ?? null,
    nextStepDescription: nextStep?.description ?? null,
    progressLabel: `${preparedCount} von ${totalCount} Schritten vorbereitet`,
  };
}

export function getWorkflowPanelSummary(
  instance: WorkflowInstance
): WorkflowPanelSummary {
  const progress = computeWorkflowProgress(instance);

  return {
    intro: HELPY_WORKFLOW_INTRO,
    nextStep: progress.nextStepTitle ?? "Alle Schritte erledigt",
    progress,
  };
}

function completeStep(
  instance: WorkflowInstance,
  stepId: string,
  finalStatus: WorkflowStepStatus
): ConfirmStepResult {
  const stepIndex = instance.steps.findIndex((step) => step.id === stepId);
  if (stepIndex === -1) {
    return {
      success: false,
      helpyMessage: "Dieser Schritt wurde nicht gefunden.",
      progress: computeWorkflowProgress(instance),
    };
  }

  const step = instance.steps[stepIndex];
  if (step.completed) {
    return {
      success: false,
      helpyMessage: "Dieser Schritt ist bereits erledigt.",
      progress: computeWorkflowProgress(instance),
    };
  }

  if (
    step.status !== "in-pruefung" &&
    step.status !== "vorbereitet"
  ) {
    return {
      success: false,
      helpyMessage: "Dieser Schritt ist noch nicht dran.",
      progress: computeWorkflowProgress(instance),
    };
  }

  const updatedSteps = instance.steps.map((item, index) => {
    if (index !== stepIndex) return item;
    return {
      ...item,
      status: finalStatus,
      completed: true,
    };
  });

  const withNext = activateNextSteps(updatedSteps);
  const updated: WorkflowInstance = { ...instance, steps: withNext };
  saveWorkflowInstance(updated);

  const progress = computeWorkflowProgress(updated);
  const nextTitle = progress.nextStepTitle;

  return {
    success: true,
    helpyMessage: nextTitle
      ? `Bestätigt. Als Nächstes bitte prüfen: ${nextTitle}.`
      : "Der Arbeitsablauf ist abgeschlossen.",
    progress,
  };
}

export function confirmWorkflowStep(
  vorgangId: string,
  stepId: string
): ConfirmStepResult {
  const instance = getWorkflowInstance(vorgangId);
  if (!instance) {
    return {
      success: false,
      helpyMessage: "Kein Arbeitsablauf vorhanden.",
      progress: {
        preparedCount: 0,
        totalCount: 0,
        completedCount: 0,
        nextStepTitle: null,
        nextStepDescription: null,
        progressLabel: "0 von 0 Schritten vorbereitet",
      },
    };
  }

  return completeStep(instance, stepId, "bestaetigt");
}

export function reviewWorkflowStep(
  vorgangId: string,
  stepId: string
): ConfirmStepResult {
  const instance = getWorkflowInstance(vorgangId);
  if (!instance) {
    return {
      success: false,
      helpyMessage: "Kein Arbeitsablauf vorhanden.",
      progress: computeWorkflowProgress({
        id: "",
        templateId: "",
        name: "",
        skill: "real-estate",
        trigger: "neue-email",
        vorgangId,
        steps: [],
        createdAt: "",
      }),
    };
  }

  const stepIndex = instance.steps.findIndex((step) => step.id === stepId);
  if (stepIndex === -1) {
    return {
      success: false,
      helpyMessage: "Dieser Schritt wurde nicht gefunden.",
      progress: computeWorkflowProgress(instance),
    };
  }

  const step = instance.steps[stepIndex];
  if (step.completed) {
    return {
      success: false,
      helpyMessage: "Dieser Schritt ist bereits erledigt.",
      progress: computeWorkflowProgress(instance),
    };
  }

  if (step.status !== "vorbereitet" && step.status !== "in-pruefung") {
    return {
      success: false,
      helpyMessage: "Dieser Schritt ist noch nicht dran.",
      progress: computeWorkflowProgress(instance),
    };
  }

  const updatedSteps = instance.steps.map((item, index) =>
    index === stepIndex ? { ...item, status: "in-pruefung" as const } : item
  );
  const updated: WorkflowInstance = { ...instance, steps: updatedSteps };
  saveWorkflowInstance(updated);

  return {
    success: true,
    helpyMessage: "Bitte prüfe die Angaben und bestätige den Schritt.",
    progress: computeWorkflowProgress(updated),
  };
}

export function ensureWorkflowForInput(input: ResolveWorkflowInput): WorkflowInstance {
  const existing = getWorkflowInstance(input.vorgangId);
  if (existing) return existing;

  const template = selectWorkflowTemplate(input);
  const instance = createWorkflowInstance(template, input.vorgangId);
  saveWorkflowInstance(instance);
  return instance;
}

export function ensureWorkflowFromDecision(
  input: ResolveWorkflowInput,
  templateId: string,
  focusStepId: string
): WorkflowInstance {
  const existing = getWorkflowInstance(input.vorgangId);
  if (existing) return existing;

  const template =
    getWorkflowTemplateById(templateId) ?? selectWorkflowTemplate(input);
  const instance = createWorkflowInstance(template, input.vorgangId);
  const focusIndex = instance.steps.findIndex((step) => step.id === focusStepId);

  const steps = instance.steps.map((step, index) => {
    if (focusIndex >= 0 && index < focusIndex) {
      return { ...step, status: "bestaetigt" as const, completed: true };
    }
    if (step.id === focusStepId) {
      return { ...step, status: "in-pruefung" as const, completed: false };
    }
    if (focusIndex >= 0 && index === focusIndex + 1) {
      return { ...step, status: "vorbereitet" as const, completed: false };
    }
    return { ...step, status: "erkannt" as const, completed: false };
  });

  const tailored = { ...instance, steps };
  saveWorkflowInstance(tailored);
  return tailored;
}

export function resetWorkflowStore(): void {
  instances.clear();
  notify();
}
