import type {
  WorkflowStepTemplate,
  WorkflowTemplate,
} from "@/features/workflow/services/automation/workflow-types";

function step(
  id: string,
  title: string,
  description: string,
  preparedAction: WorkflowStepTemplate["preparedAction"],
  options: {
    dependsOn?: string[];
    reviewLabel?: "pruefen" | "bestaetigen";
  } = {}
): WorkflowStepTemplate {
  return {
    id,
    title,
    description,
    required: true,
    dependsOn: options.dependsOn ?? [],
    preparedAction,
    reviewLabel: options.reviewLabel ?? "bestaetigen",
  };
}

export function cloneWorkflowSteps(
  templates: WorkflowStepTemplate[]
): WorkflowStepTemplate[] {
  return templates.map((item) => ({
    ...item,
    dependsOn: [...item.dependsOn],
    preparedAction: { ...item.preparedAction },
  }));
}

export function instantiateStepsFromTemplate(
  templates: WorkflowStepTemplate[]
): import("@/features/workflow/services/automation/workflow-types").WorkflowStep[] {
  return templates.map((template, index) => ({
    ...template,
    status: index === 0 ? "in-pruefung" : index === 1 ? "vorbereitet" : "erkannt",
    completed: false,
  }));
}

export function buildWorkflowTemplate(
  template: Omit<WorkflowTemplate, "steps"> & { steps: WorkflowStepTemplate[] }
): WorkflowTemplate {
  return {
    ...template,
    steps: cloneWorkflowSteps(template.steps),
  };
}
