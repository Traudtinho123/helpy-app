import { isGmailVorgang } from "@/features/decision/services/decision-engine";
import { getCustomerMemoryWorkspaceView } from "@/features/memory/services/memory-v2-engine";
import {
  formatMemoryBullet,
  matchesSkillMemory,
  MEMORY_INTRO_CUSTOMER,
  MEMORY_INTRO_PANEL,
  selectPanelMemories,
  sortMemoriesByRelevance,
} from "@/features/memory/services/memory-rules";
import {
  getAllMockMemories,
  getSkillMemories,
  resolveCustomerIdForVorgang,
} from "@/features/memory/services/mock-memory";
import {
  getAllMemories,
  getMemoriesByCustomer,
  getUserMemories,
  initMemoryStore,
} from "@/features/memory/services/memory-store";
import type {
  MemoryContext,
  MemoryEntry,
  MemoryPanelResult,
} from "@/features/memory/services/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import type { Vorgang } from "@/features/workspace/services/workspace/types";

let initialized = false;

export function ensureMemoryEngine(): void {
  if (initialized) return;
  initMemoryStore(getAllMockMemories());
  initialized = true;
}

function collectContextMemories(context: MemoryContext): MemoryEntry[] {
  ensureMemoryEngine();

  const entries: MemoryEntry[] = [];

  if (context.customerId) {
    entries.push(...getMemoriesByCustomer(context.customerId));
  }

  entries.push(...getUserMemories());
  entries.push(...getSkillMemories(context.skill));

  return entries.filter((entry) => matchesSkillMemory(entry, context.skill));
}

export function getMemoryPanelForVorgang(
  vorgang: Vorgang,
  skill: HelpySkill
): MemoryPanelResult {
  if (isGmailVorgang(vorgang)) {
    const view = getCustomerMemoryWorkspaceView(vorgang, skill);
    return {
      title: "HELPY merkt sich",
      intro: MEMORY_INTRO_PANEL,
      bullets: view.panelBullets,
    };
  }

  const customerId = resolveCustomerIdForVorgang(vorgang.id);

  const entries = collectContextMemories({
    customerId,
    vorgangId: vorgang.id,
    skill,
  });

  const selected = selectPanelMemories(entries, 5);

  return {
    title: "HELPY merkt sich",
    intro: MEMORY_INTRO_PANEL,
    bullets: selected.map(formatMemoryBullet),
  };
}

export function getCustomerMemoryEntries(
  customerId: string,
  skill?: HelpySkill
): MemoryEntry[] {
  ensureMemoryEngine();

  const customerEntries = getMemoriesByCustomer(customerId);
  const userEntries = getUserMemories().slice(0, 1);
  const skillEntries = skill ? getSkillMemories(skill).slice(0, 1) : [];

  return sortMemoriesByRelevance([
    ...customerEntries,
    ...userEntries,
    ...skillEntries,
  ]);
}

export function getCustomerMemorySnapshot(
  customerId: string,
  skill?: HelpySkill
): {
  intro: string;
  entries: MemoryEntry[];
} {
  return {
    intro: MEMORY_INTRO_CUSTOMER,
    entries: getCustomerMemoryEntries(customerId, skill),
  };
}

export function listAllMemories(): MemoryEntry[] {
  ensureMemoryEngine();
  return getAllMemories();
}
