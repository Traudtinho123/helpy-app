import type { SkillConfig, SkillId } from "@/features/workspace/services/skills/all-skills";
import { ALL_SKILLS } from "@/features/workspace/services/skills/all-skills";
import type {
  SkillTerminology,
  TerminologyBySkill,
} from "@/features/workspace/services/terminology/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

function skillConfigToTerminology(config: SkillConfig): SkillTerminology {
  return {
    customer: { singular: config.kunde, plural: config.kunden },
    customerNew: {
      singular: `Neuer ${config.kunde}`,
      plural: `Neue ${config.kunden}`,
    },
    prospect: { singular: config.kunde, plural: config.kunden },
    portfolioItem: { singular: config.objekt, plural: config.objekte },
    viewing: { singular: config.termin, plural: config.termine },
    offer: { singular: "Angebot", plural: "Angebote" },
    case: { singular: config.vorgang, plural: config.vorgaenge },
  };
}

function buildTerminologyFromAllSkills(): TerminologyBySkill {
  const result = {} as TerminologyBySkill;
  for (const [skillId, config] of Object.entries(ALL_SKILLS)) {
    result[skillId as HelpySkill] = skillConfigToTerminology(config);
  }
  return result;
}

/**
 * Zentrale Skill-Terminologie.
 * Abgeleitet aus features/workspace/services/skills/all-skills.ts
 */
export const SKILL_TERMINOLOGY: TerminologyBySkill = buildTerminologyFromAllSkills();

export function getSkillNavLabels(skill: SkillId) {
  return ALL_SKILLS[skill].nav;
}
