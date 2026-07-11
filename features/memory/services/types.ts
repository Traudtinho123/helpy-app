import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export type MemoryScope = "kunde" | "nutzer" | "branche";

export type MemorySource = "helpy" | "manuell";

export type MemoryEntry = {
  id: string;
  scope: MemoryScope;
  title: string;
  insight: string;
  source: MemorySource;
  customerId?: string;
  skill?: HelpySkill;
  createdAt: string;
  relevance?: number;
};

export type MemoryContext = {
  customerId?: string;
  vorgangId?: string;
  skill: HelpySkill;
  userId?: string;
};

export type MemorySnapshot = {
  entries: MemoryEntry[];
  intro: string;
  bullets: string[];
};

export type MemoryPanelResult = {
  title: string;
  intro: string;
  bullets: string[];
};
