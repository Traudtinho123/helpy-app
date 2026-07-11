import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

/** Begriffe, die sich je nach HELPY-Skill unterscheiden. */
export type TermKey =
  | "customer"
  | "customerNew"
  | "prospect"
  | "portfolioItem"
  | "viewing"
  | "offer"
  | "case";

export type TermForm = "singular" | "plural";

export type TermForms = {
  singular: string;
  plural: string;
};

export type SkillTerminology = Record<TermKey, TermForms>;

export type TerminologyBySkill = Record<HelpySkill, SkillTerminology>;
