"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  getCompanyProfileSnapshot,
  getCompanyProfileServerSnapshot,
  subscribeCompanyProfileStore,
} from "@/lib/company/company-profile-service";
import {
  subscribeSubscription,
} from "@/features/subscription/services/subscription-service";
import {
  getSkillConfig,
} from "@/features/workspace/services/workspace/skills";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";

const SKILL_CHANGE_EVENT = "helpy-skill-change";

type ActiveSkillContextValue = {
  activeSkill: HelpySkill;
  /** Deaktiviert — Skill kommt nur aus dem Abo. */
  setActiveSkill: (skill: HelpySkill) => void;
  activeSkillLabel: string;
  canSwitchSkill: false;
};

const ActiveSkillContext = createContext<ActiveSkillContextValue | null>(null);

const DEFAULT_ACTIVE_SKILL = getCompanyProfileServerSnapshot().activePaidSkill;

function readActiveSkill(): HelpySkill {
  return getCompanyProfileSnapshot().activePaidSkill;
}

function getActiveSkillServerSnapshot(): HelpySkill {
  return DEFAULT_ACTIVE_SKILL;
}

function subscribeActiveSkill(onStoreChange: () => void): () => void {
  const handler = () => onStoreChange();

  if (typeof window !== "undefined") {
    window.addEventListener(SKILL_CHANGE_EVENT, handler);
  }

  const unsubscribeCompany = subscribeCompanyProfileStore(handler);
  const unsubscribeSubscription = subscribeSubscription(handler);

  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener(SKILL_CHANGE_EVENT, handler);
    }
    unsubscribeCompany();
    unsubscribeSubscription();
  };
}

export function ActiveSkillProvider({ children }: { children: React.ReactNode }) {
  const activeSkill = useSyncExternalStore(
    subscribeActiveSkill,
    readActiveSkill,
    getActiveSkillServerSnapshot
  );

  const setActiveSkill = useCallback((_skill: HelpySkill) => {
    // Skill kommt ausschließlich aus profiles.allowed_skills — kein Client-Wechsel.
  }, []);

  const value = useMemo(
    () => ({
      activeSkill,
      setActiveSkill,
      activeSkillLabel: getSkillConfig(activeSkill).label,
      canSwitchSkill: false as const,
    }),
    [activeSkill, setActiveSkill]
  );

  return (
    <ActiveSkillContext.Provider value={value}>
      {children}
    </ActiveSkillContext.Provider>
  );
}

export function useActiveSkill() {
  const context = useContext(ActiveSkillContext);
  if (!context) {
    throw new Error("useActiveSkill must be used within ActiveSkillProvider");
  }
  return context;
}
