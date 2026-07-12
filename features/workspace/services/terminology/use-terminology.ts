"use client";

import { useCallback, useMemo } from "react";
import { useActiveSkill } from "@/components/user-menu/active-skill-context";
import {
  getAllSkillConfig,
  type SkillNavLabels,
} from "@/features/workspace/services/skills/all-skills";
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
  kunde: string;
  kunden: string;
  objekt: string;
  objekte: string;
  vorgang: string;
  vorgaenge: string;
  termin: string;
  termine: string;
  hauptaktion: string;
  intents: string[];
  nav: SkillNavLabels;
};

/**
 * Skill-abhängige Terminologie für UI-Texte.
 * Basiert auf dem aktiven HELPY-Skill (Company-Profil / Vorschau).
 */
export function useTerminology(): TerminologyApi {
  const { activeSkill } = useActiveSkill();
  const config = getAllSkillConfig(activeSkill);

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
      kunde: config.kunde,
      kunden: config.kunden,
      objekt: config.objekt,
      objekte: config.objekte,
      vorgang: config.vorgang,
      vorgaenge: config.vorgaenge,
      termin: config.termin,
      termine: config.termine,
      hauptaktion: config.hauptaktion,
      intents: config.intents,
      nav: config.nav,
    }),
    [activeSkill, config, forms, t]
  );
}
