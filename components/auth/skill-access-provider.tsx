"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import { updateLoadedCompanyProfile } from "@/lib/company/company-profile-service";
import {
  applyDatabaseSkillAccess,
  clearDatabaseSkillAccess,
} from "@/features/subscription/services/subscription-service";
import { isPublicRoute } from "@/lib/auth/routes";

type SkillAccessContextValue = {
  allowedSkills: HelpySkill[];
  activeSkill: HelpySkill | null;
  hasAccess: boolean;
  email: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const SkillAccessContext = createContext<SkillAccessContextValue | null>(null);

async function fetchSkillAccess(): Promise<{
  allowedSkills: HelpySkill[];
  activeSkill: HelpySkill | null;
  hasAccess: boolean;
  email: string | null;
}> {
  const response = await fetch("/api/skill-access", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

  if (response.status === 401) {
    return {
      allowedSkills: [],
      activeSkill: null,
      hasAccess: false,
      email: null,
    };
  }

  if (!response.ok) {
    throw new Error("Skill-Zugang konnte nicht geladen werden.");
  }

  const data = (await response.json()) as {
    allowedSkills: HelpySkill[];
    activeSkill: HelpySkill | null;
    hasAccess: boolean;
    email: string | null;
  };

  return {
    allowedSkills: data.allowedSkills ?? [],
    activeSkill: data.activeSkill ?? null,
    hasAccess: Boolean(data.hasAccess),
    email: data.email ?? null,
  };
}

function clearSkillAccessState(
  setAllowedSkills: (skills: HelpySkill[]) => void,
  setActiveSkill: (skill: HelpySkill | null) => void,
  setHasAccess: (value: boolean) => void,
  setEmail: (email: string | null) => void,
  setError: (error: string | null) => void
): void {
  setAllowedSkills([]);
  setActiveSkill(null);
  setHasAccess(false);
  setEmail(null);
  setError(null);
  clearDatabaseSkillAccess();
}

export function SkillAccessProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = isPublicRoute(pathname);

  const [allowedSkills, setAllowedSkills] = useState<HelpySkill[]>([]);
  const [activeSkill, setActiveSkill] = useState<HelpySkill | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (isAuthPage) {
      clearSkillAccessState(
        setAllowedSkills,
        setActiveSkill,
        setHasAccess,
        setEmail,
        setError
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchSkillAccess();
      setAllowedSkills(data.allowedSkills);
      setActiveSkill(data.activeSkill);
      setHasAccess(data.hasAccess);
      setEmail(data.email);

      if (data.activeSkill) {
        updateLoadedCompanyProfile({ activePaidSkill: data.activeSkill });
        applyDatabaseSkillAccess(data.allowedSkills, data.activeSkill);
      } else {
        clearDatabaseSkillAccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setAllowedSkills([]);
      setActiveSkill(null);
      setHasAccess(false);
      clearDatabaseSkillAccess();
    } finally {
      setLoading(false);
    }
  }, [isAuthPage]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      allowedSkills,
      activeSkill,
      hasAccess,
      email,
      loading,
      error,
      refresh,
    }),
    [allowedSkills, activeSkill, hasAccess, email, loading, error, refresh]
  );

  return (
    <SkillAccessContext.Provider value={value}>
      {children}
    </SkillAccessContext.Provider>
  );
}

export function useSkillAccessContext(): SkillAccessContextValue {
  const context = useContext(SkillAccessContext);
  if (!context) {
    throw new Error(
      "useSkillAccessContext must be used within SkillAccessProvider"
    );
  }
  return context;
}
