"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getCompanyProfileHydrationState,
  getCompanyProfileHydrationStateServerSnapshot,
  getCompanyProfileSnapshot,
  getCompanyProfileServerSnapshot,
  hydrateCompanyProfileFromApi,
  persistCompanyProfile,
  subscribeCompanyProfileStore,
  updateLoadedCompanyProfile,
  resetLoadedCompanyProfile,
} from "@/lib/company/company-profile-service";
import type { CompanyProfile } from "@/lib/company/company-profile-types";
import { useUserProfileContext } from "@/lib/user/components/user-profile-context";

type CompanyProfileContextValue = {
  profile: CompanyProfile;
  updateProfile: (updates: Partial<CompanyProfile>) => void;
  resetProfile: () => void;
  saveProfile: () => Promise<{ ok: true } | { ok: false; error: string }>;
  isLoaded: boolean;
  isHydrating: boolean;
  hydrationError: string | null;
};

const CompanyProfileContext = createContext<CompanyProfileContextValue | null>(
  null
);

function useHydrationState() {
  return useSyncExternalStore(
    subscribeCompanyProfileStore,
    getCompanyProfileHydrationState,
    getCompanyProfileHydrationStateServerSnapshot
  );
}

export function CompanyProfileProvider({ children }: { children: ReactNode }) {
  const { profile: userProfile, isLoaded: userLoaded } = useUserProfileContext();
  const hydration = useHydrationState();

  useEffect(() => {
    if (!userLoaded || !userProfile.companyId) return;
    void hydrateCompanyProfileFromApi(userProfile.companyId);
  }, [userLoaded, userProfile.companyId]);

  const profile = useSyncExternalStore(
    subscribeCompanyProfileStore,
    getCompanyProfileSnapshot,
    getCompanyProfileServerSnapshot
  );

  const updateProfile = useCallback((updates: Partial<CompanyProfile>) => {
    updateLoadedCompanyProfile(updates);
  }, []);

  const resetProfile = useCallback(() => {
    resetLoadedCompanyProfile();
  }, []);

  const saveProfile = useCallback(async () => {
    const current = getCompanyProfileSnapshot();
    const result = await persistCompanyProfile(current);
    if (!result.ok) {
      return { ok: false as const, error: result.error };
    }
    return { ok: true as const };
  }, []);

  const value = useMemo(
    () => ({
      profile,
      updateProfile,
      resetProfile,
      saveProfile,
      isLoaded: userLoaded && profile.companyId === userProfile.companyId,
      isHydrating: hydration.isHydrating,
      hydrationError: hydration.error,
    }),
    [
      hydration.error,
      hydration.isHydrating,
      profile,
      resetProfile,
      saveProfile,
      updateProfile,
      userLoaded,
      userProfile.companyId,
    ]
  );

  return (
    <CompanyProfileContext.Provider value={value}>
      {children}
    </CompanyProfileContext.Provider>
  );
}

export function useCompanyProfile(): CompanyProfileContextValue {
  const context = useContext(CompanyProfileContext);
  if (!context) {
    throw new Error(
      "useCompanyProfile must be used within CompanyProfileProvider"
    );
  }
  return context;
}
