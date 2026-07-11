import { createAutopilotIdleState, runAutopilotPipeline } from "@/features/brain/services/autopilot";
import { createInitialWorkSteps } from "@/features/workflow/services/helpy-work/steps";
import type {
  HelpyWorkRunOptions,
  HelpyWorkState,
  HelpyWorkStep,
} from "@/features/workflow/services/helpy-work/types";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createInitialHelpyWorkState(): HelpyWorkState {
  return {
    buttonState: "new_vorgaenge",
    status: "idle",
    workSteps: createInitialWorkSteps(),
    autopilot: createAutopilotIdleState(),
  };
}

function setStepStatuses(
  steps: HelpyWorkStep[],
  activeIndex: number
): HelpyWorkStep[] {
  return steps.map((step, index) => ({
    ...step,
    status:
      index < activeIndex
        ? "completed"
        : index === activeIndex
          ? "active"
          : "pending",
  }));
}

export async function runHelpyWorkSession(
  options?: HelpyWorkRunOptions
): Promise<HelpyWorkState> {
  const stepDelayMs = options?.stepDelayMs ?? 550;
  let workSteps = createInitialWorkSteps();

  const emit = (partial: Partial<HelpyWorkState>) => {
    options?.onUpdate?.({
      buttonState: "updating",
      status: "running",
      workSteps,
      autopilot: createAutopilotIdleState(),
      ...partial,
    });
  };

  emit({
    buttonState: "updating",
    status: "running",
    workSteps: setStepStatuses(workSteps, 0),
    autopilot: createAutopilotIdleState(),
  });

  for (let i = 0; i < workSteps.length; i++) {
    workSteps = setStepStatuses(workSteps, i);
    emit({ workSteps });

    await delay(stepDelayMs);

    workSteps = workSteps.map((step, index) => ({
      ...step,
      status: index <= i ? "completed" : "pending",
    }));
  }

  let autopilotState = createAutopilotIdleState();

  await runAutopilotPipeline({
    stepDelayMs: 300,
    onUpdate: (autopilot) => {
      autopilotState = autopilot;
      options?.onUpdate?.({
        buttonState: "updating",
        status: "running",
        workSteps,
        autopilot,
      });
    },
  });

  const finalState: HelpyWorkState = {
    buttonState: "current",
    status: "completed",
    workSteps: workSteps.map((s) => ({ ...s, status: "completed" as const })),
    autopilot: autopilotState,
  };

  options?.onUpdate?.(finalState);
  return finalState;
}
