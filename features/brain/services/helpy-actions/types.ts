import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

export type HelpyAction = {
  id: string;
  icon: string;
  title: string;
  description: string;
  benefit: string;
  primaryLabel: string;
  priority: number;
};

export type HelpyActionScenario =
  | "besichtigung"
  | "interessent"
  | "offertanfrage"
  | "rueckfrage"
  | "neue-anfrage"
  | "frist"
  | "termin"
  | "angebot"
  | "allgemein";

export type HelpyActionAnalysis = {
  scenario: HelpyActionScenario;
  scenarioLabel: string;
  analysisText: string;
  actions: HelpyAction[];
};

export type AnalyzeActionsInput = {
  vorgang: Vorgang;
  skill: HelpySkill;
};

export type HelpyActionExecutionState = "idle" | "preparing" | "done";

export type HelpyActionCardState = {
  actionId: string;
  status: HelpyActionExecutionState;
};
