"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { UserPermissionsSnapshot } from "@/lib/auth/permissions";

type PermissionsContextValue = {
  permissions: UserPermissionsSnapshot | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

const DEV_PERMISSIONS: UserPermissionsSnapshot = {
  userId: "dev-user",
  companyId: "dev-company",
  role: "super_admin",
  isSuperAdmin: true,
  canEditAISettings: true,
  canInviteUsers: true,
  canSwitchSkill: true,
  availableSkills: ["real-estate", "construction", "consulting-legal"],
  profileAllowedSkills: ["real-estate"],
};

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [permissions, setPermissions] = useState<UserPermissionsSnapshot | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/permissions", {
        cache: "no-store",
      });
      if (!response.ok) {
        setPermissions(DEV_PERMISSIONS);
        return;
      }
      const payload = (await response.json()) as {
        permissions?: UserPermissionsSnapshot;
      };
      setPermissions(payload.permissions ?? DEV_PERMISSIONS);
    } catch {
      setPermissions(DEV_PERMISSIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ permissions, loading, refresh }),
    [permissions, loading, refresh]
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within PermissionsProvider");
  }
  return context;
}

export function useCanEditAISettings(): boolean {
  const { permissions } = usePermissions();
  return permissions?.canEditAISettings ?? false;
}

export function useCanInviteUsers(): boolean {
  const { permissions } = usePermissions();
  return permissions?.canInviteUsers ?? false;
}
