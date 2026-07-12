"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { usePermissions } from "@/components/auth/permissions-provider";
import {
  getCompanyProfileSnapshot,
  getCompanyProfileServerSnapshot,
  subscribeCompanyProfileStore,
} from "@/lib/company/company-profile-service";
import { subscribeSubscription } from "@/features/subscription/services/subscription-service";
import { isPreviewSkillId } from "@/features/workspace/services/skills/all-skills";
import {
  getSkillConfig,
  type HelpySkill,
} from "@/features/workspace/services/workspace/skills";

const SKILL_CHANGE_EVENT = "helpy-skill-change";
const PREVIEW_SKILL_STORAGE_KEY = "helpy-preview-skill";

type ActiveSkillContextValue = {
  activeSkill: HelpySkill;
  profileSkill: HelpySkill;
  previewSkill: HelpySkill | null;
  isPreviewMode: boolean;
  setActiveSkill: (skill: HelpySkill) => void;
  clearPreviewSkill: () => void;
  activeSkillLabel: string;
  canSwitchSkill: boolean;
};

const ActiveSkillContext = createContext<ActiveSkillContextValue | null>(null);

const DEFAULT_ACTIVE_SKILL = getCompanyProfileServerSnapshot().activePaidSkill;

function readProfileSkill(): HelpySkill {
  return getCompanyProfileSnapshot().activePaidSkill;
}

function getProfileSkillServerSnapshot(): HelpySkill {
  return DEFAULT_ACTIVE_SKILL;
}

function readPreviewSkill(): HelpySkill | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PREVIEW_SKILL_STORAGE_KEY);
  if (raw && isPreviewSkillId(raw)) {
    return raw;
  }
  return null;
}

function getPreviewSkillServerSnapshot(): HelpySkill | null {
  return null;
}

function subscribePreviewSkill(onStoreChange: () => void): () => void {
  const handler = () => onStoreChange();

  if (typeof window !== "undefined") {
    window.addEventListener(SKILL_CHANGE_EVENT, handler);
    window.addEventListener("storage", handler);
  }

  const unsubscribeCompany = subscribeCompanyProfileStore(handler);
  const unsubscribeSubscription = subscribeSubscription(handler);

  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener(SKILL_CHANGE_EVENT, handler);
      window.removeEventListener("storage", handler);
    }
    unsubscribeCompany();
    unsubscribeSubscription();
  };
}

function emitSkillChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SKILL_CHANGE_EVENT));
  }
}

export function ActiveSkillProvider({ children }: { children: React.ReactNode }) {
  const { permissions } = usePermissions();
  const canSwitchSkill = permissions?.canSwitchSkill ?? false;

  const profileSkill = useSyncExternalStore(
    subscribePreviewSkill,
    readProfileSkill,
    getProfileSkillServerSnapshot
  );

  const previewSkill = useSyncExternalStore(
    subscribePreviewSkill,
    readPreviewSkill,
    getPreviewSkillServerSnapshot
  );

  const activeSkill =
    canSwitchSkill && previewSkill ? previewSkill : profileSkill;

  const setActiveSkill = useCallback(
    (skill: HelpySkill) => {
      if (!canSwitchSkill || typeof window === "undefined") return;
      window.localStorage.setItem(PREVIEW_SKILL_STORAGE_KEY, skill);
      emitSkillChange();
    },
    [canSwitchSkill]
  );

  const clearPreviewSkill = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(PREVIEW_SKILL_STORAGE_KEY);
    emitSkillChange();
  }, []);

  const value = useMemo(
    () => ({
      activeSkill,
      profileSkill,
      previewSkill: canSwitchSkill ? previewSkill : null,
      isPreviewMode: canSwitchSkill && previewSkill !== null,
      setActiveSkill,
      clearPreviewSkill,
      activeSkillLabel: getSkillConfig(activeSkill).label,
      canSwitchSkill,
    }),
    [
      activeSkill,
      profileSkill,
      previewSkill,
      canSwitchSkill,
      setActiveSkill,
      clearPreviewSkill,
    ]
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
