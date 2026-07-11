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
  getCompanyProfileSnapshot,
  getCompanyProfileServerSnapshot,
  loadCompanyProfileById,
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
  isLoaded: boolean;
};

const CompanyProfileContext = createContext<CompanyProfileContextValue | null>(
  null
);

export function CompanyProfileProvider({ children }: { children: ReactNode }) {
  const { profile: userProfile, isLoaded: userLoaded } = useUserProfileContext();

  useEffect(() => {
    if (!userLoaded || !userProfile.companyId) return;
    loadCompanyProfileById(userProfile.companyId);
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

  const value = useMemo(
    () => ({
      profile,
      updateProfile,
      resetProfile,
      isLoaded: userLoaded && profile.companyId === userProfile.companyId,
    }),
    [profile, resetProfile, updateProfile, userLoaded, userProfile.companyId]
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
