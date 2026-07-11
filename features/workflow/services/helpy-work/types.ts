import type { AutopilotRunState } from "@/features/brain/services/autopilot/types";

export type HelpyWorkStepId =
  | "emails"
  | "calendar"
  | "offers"
  | "invoices"
  | "customers"
  | "tasks"
  | "daily_plan";

export type HelpyWorkStepStatus = "pending" | "active" | "completed";

export type HelpyWorkButtonState = "current" | "new_vorgaenge" | "updating";

export type HelpyWorkStep = {
  id: HelpyWorkStepId;
  label: string;
  panelMessage: string;
  status: HelpyWorkStepStatus;
};

export type HelpyWorkStatus = "idle" | "running" | "completed";

export type HelpyWorkState = {
  buttonState: HelpyWorkButtonState;
  status: HelpyWorkStatus;
  workSteps: HelpyWorkStep[];
  autopilot: AutopilotRunState;
};

export type HelpyWorkRunOptions = {
  stepDelayMs?: number;
  onUpdate?: (state: HelpyWorkState) => void;
};
