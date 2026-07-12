import type { ActionDefinition, ActionTypeId } from "@/features/review/services/actions/types";
import { ACTION_CATALOG } from "@/features/review/services/actions/mock-actions";
import { buildSkillRecord } from "@/features/workspace/services/skills/skill-defaults";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

const REAL_ESTATE_ACTIONS: ActionTypeId[] = [
  "interessent-anlegen",
  "besichtigung-planen",
  "expose-vorbereiten",
  "antwort-vorbereiten",
  "rueckruf-planen",
];

export const SKILL_ACTION_TYPES: Record<HelpySkill, ActionTypeId[]> =
  buildSkillRecord(
    {
      "real-estate": REAL_ESTATE_ACTIONS,
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
    },
    REAL_ESTATE_ACTIONS
  );

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
