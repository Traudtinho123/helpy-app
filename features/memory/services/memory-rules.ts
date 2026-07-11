import type { MemoryEntry, MemoryScope } from "@/features/memory/services/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

const SCOPE_PRIORITY: Record<MemoryScope, number> = {
  kunde: 3,
  nutzer: 2,
  branche: 1,
};

export function sortMemoriesByRelevance(entries: MemoryEntry[]): MemoryEntry[] {
  return [...entries].sort((a, b) => {
    const scopeDiff = SCOPE_PRIORITY[b.scope] - SCOPE_PRIORITY[a.scope];
    if (scopeDiff !== 0) return scopeDiff;
    return (b.relevance ?? 0) - (a.relevance ?? 0);
  });
}

export function selectPanelMemories(
  entries: MemoryEntry[],
  limit = 5
): MemoryEntry[] {
  return sortMemoriesByRelevance(entries).slice(0, limit);
}

export function formatMemoryBullet(entry: MemoryEntry): string {
  return entry.insight;
}

export function matchesSkillMemory(
  entry: MemoryEntry,
  skill: HelpySkill
): boolean {
  return entry.scope !== "branche" || entry.skill === skill;
}

export const MEMORY_INTRO_PANEL =
  "Ich merke mir hilfreiche Arbeitsdetails, damit ich dich besser unterstützen kann.";

export const MEMORY_INTRO_CUSTOMER =
  "Ich merke mir hilfreiche Details zu diesem Kunden — damit du schneller und persönlicher arbeiten kannst.";

export const MEMORY_SOURCE_LABELS = {
  helpy: "Von HELPY erkannt",
  manuell: "Manuell hinzugefügt",
} as const;
