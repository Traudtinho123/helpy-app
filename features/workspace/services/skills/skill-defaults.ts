import type { SkillId } from "@/features/workspace/services/skills/all-skills";
import { ALL_SKILLS } from "@/features/workspace/services/skills/all-skills";

/** Alle HELPY-Skill-IDs (Reihenfolge für Anzeige). */
export const ALL_HELPY_SKILL_IDS: readonly SkillId[] = [
  "real-estate",
  "coiffeur",
  "gym",
  "doctor",
  "cosmetic",
  "physio",
  "gastro",
  "clean",
  "garden",
  "construction",
  "consulting-legal",
] as const;

/** Baut ein vollständiges Record<HelpySkill, T> aus Overrides + Fallback. */
export function buildSkillRecord<T>(
  overrides: Partial<Record<SkillId, T>>,
  fallback: T
): Record<SkillId, T> {
  const result = {} as Record<SkillId, T>;
  for (const skill of ALL_HELPY_SKILL_IDS) {
    result[skill] = overrides[skill] ?? fallback;
  }
  return result;
}

/** Emoji-Map aus zentraler Skill-Konfiguration. */
export function buildSkillEmojiRecord(): Record<SkillId, string> {
  const result = {} as Record<SkillId, string>;
  for (const skill of ALL_HELPY_SKILL_IDS) {
    result[skill] = ALL_SKILLS[skill].emoji;
  }
  return result;
}
