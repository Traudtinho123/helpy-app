import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

const VALID_SKILLS: readonly HelpySkill[] = [
  "real-estate",
  "construction",
  "consulting-legal",
];

/** Shared (Edge-safe) — keine Server-only Imports. */
export function normalizeAllowedSkills(
  raw: string[] | null | undefined
): HelpySkill[] {
  if (!raw || raw.length === 0) return [];
  const allowed = new Set<string>(VALID_SKILLS);
  const seen = new Set<HelpySkill>();
  const result: HelpySkill[] = [];
  for (const entry of raw) {
    if (allowed.has(entry) && !seen.has(entry as HelpySkill)) {
      seen.add(entry as HelpySkill);
      result.push(entry as HelpySkill);
    }
  }
  return result;
}
