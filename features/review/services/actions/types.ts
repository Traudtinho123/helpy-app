import { HELPY_PREPARED_LABEL } from "@/features/review/services/safety/review-mode";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { VorgangPriority } from "@/features/workspace/services/vorgaenge/types";

export type ActionTypeId =
  | "interessent-anlegen"
  | "besichtigung-planen"
  | "expose-vorbereiten"
  | "antwort-vorbereiten"
  | "rueckruf-planen"
  | "kunde-anlegen"
  | "baustellenbesichtigung-planen"
  | "offerte-vorbereiten"
  | "materialliste-vorbereiten"
  | "mandant-anlegen"
  | "erstgespraech-planen"
  | "frist-sichern"
  | "dokument-pruefen"
  | "angebot-vorbereiten";

export type ActionStatus = "bereit" | "bestaetigt";

export type ActionDefinition = {
  id: ActionTypeId;
  title: string;
  description: string;
  skill: HelpySkill;
  icon: string;
  defaultPriority: VorgangPriority;
  resultAfterExecution: string;
};

export type PreparedHelpyAction = {
  instanceId: string;
  actionTypeId: ActionTypeId;
  vorgangId: string;
  title: string;
  description: string;
  skill: HelpySkill;
  priority: VorgangPriority;
  status: ActionStatus;
  icon: string;
  resultAfterExecution: string;
};

export type ActionExecutionResult = {
  instanceId: string;
  status: ActionStatus;
  helpyMessage: string;
  resultAfterExecution: string;
};

export const ACTION_CONFIRM_MESSAGE =
  "Bestätigt. Nichts wurde automatisch versendet oder gebucht.";

export const PREPARED_ACTIONS_SECTION_TITLE = HELPY_PREPARED_LABEL;
