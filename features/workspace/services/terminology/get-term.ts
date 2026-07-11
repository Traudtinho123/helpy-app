import { SKILL_TERMINOLOGY } from "@/features/workspace/services/terminology/glossary";
import type {
  TermForm,
  TermKey,
} from "@/features/workspace/services/terminology/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export type GetTermOptions = {
  /** Default: singular */
  form?: TermForm;
  /** Ersten Buchstaben großschreiben (für Satzanfang / Labels). */
  capitalize?: boolean;
};

function applyCapitalize(value: string, capitalize?: boolean): string {
  if (!capitalize || value.length === 0) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Liefert den Begriff für einen Skill (ohne React). */
export function getTerm(
  skill: HelpySkill,
  key: TermKey,
  options: GetTermOptions = {}
): string {
  const form = options.form ?? "singular";
  const value = SKILL_TERMINOLOGY[skill][key][form];
  return applyCapitalize(value, options.capitalize);
}

/** Alle Formen eines Begriffs für einen Skill. */
export function getTermForms(skill: HelpySkill, key: TermKey) {
  return SKILL_TERMINOLOGY[skill][key];
}
