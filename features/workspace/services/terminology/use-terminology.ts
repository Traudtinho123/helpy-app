"use client";

import { useCallback, useMemo } from "react";
import { useActiveSkill } from "@/components/user-menu/active-skill-context";
import {
  getTerm,
  getTermForms,
  type GetTermOptions,
} from "@/features/workspace/services/terminology/get-term";
import type { TermKey } from "@/features/workspace/services/terminology/types";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

export type TerminologyApi = {
  skill: HelpySkill;
  /** Kurzform: t("customer", { form: "plural" }) */
  t: (key: TermKey, options?: GetTermOptions) => string;
  forms: (key: TermKey) => ReturnType<typeof getTermForms>;
};

/**
 * Skill-abhängige Terminologie für UI-Texte.
 * Basiert auf dem aktiven HELPY-Skill (Company-Profil / Abo).
 */
export function useTerminology(): TerminologyApi {
  const { activeSkill } = useActiveSkill();

  const t = useCallback(
    (key: TermKey, options?: GetTermOptions) =>
      getTerm(activeSkill, key, options),
    [activeSkill]
  );

  const forms = useCallback(
    (key: TermKey) => getTermForms(activeSkill, key),
    [activeSkill]
  );

  return useMemo(
    () => ({
      skill: activeSkill,
      t,
      forms,
    }),
    [activeSkill, forms, t]
  );
}
