import type { ActionDefinition, ActionTypeId } from "@/features/review/services/actions/types";
import { ACTION_CATALOG } from "@/features/review/services/actions/mock-actions";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export const SKILL_ACTION_TYPES: Record<HelpySkill, ActionTypeId[]> = {
  "real-estate": [
    "interessent-anlegen",
    "besichtigung-planen",
    "expose-vorbereiten",
    "antwort-vorbereiten",
    "rueckruf-planen",
  ],
  construction: [
    "kunde-anlegen",
    "baustellenbesichtigung-planen",
    "offerte-vorbereiten",
    "materialliste-vorbereiten",
    "rueckruf-planen",
  ],
  "consulting-legal": [
    "mandant-anlegen",
    "erstgespraech-planen",
    "frist-sichern",
    "dokument-pruefen",
    "angebot-vorbereiten",
    "antwort-vorbereiten",
  ],
};

export function getActionDefinition(id: ActionTypeId): ActionDefinition | undefined {
  return ACTION_CATALOG.find((action) => action.id === id);
}

export function getActionsForSkill(skill: HelpySkill): ActionDefinition[] {
  return SKILL_ACTION_TYPES[skill]
    .map(getActionDefinition)
    .filter((a): a is ActionDefinition => a !== undefined);
}

export function getAllActionDefinitions(): ActionDefinition[] {
  return [...ACTION_CATALOG];
}
