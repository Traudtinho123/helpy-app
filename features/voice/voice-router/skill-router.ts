import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export function resolveVoiceSkill(explicit?: HelpySkill): HelpySkill {
  return explicit ?? "real-estate";
}

export function getVoiceSkillLabel(skill: HelpySkill): string {
  switch (skill) {
    case "construction":
      return "Construction";
    case "consulting-legal":
      return "Consulting & Legal";
    case "real-estate":
    default:
      return "Real Estate";
  }
}
