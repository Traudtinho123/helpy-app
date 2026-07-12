"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { subscribeAppleCalendarSync } from "@/features/apple-calendar/services/apple-calendar-sync";
import { subscribeCalendarPlatform } from "@/features/calendar/services/calendar-platform";
import { syncIntegrationsFromUserProfile } from "@/features/integration-manager/services/integration-manager";
import { loadTenantContextForAuthUser } from "@/lib/tenant/services/tenant-bootstrap-service";
import { loadLiveTenantContextFromSupabase } from "@/lib/tenant/services/supabase-tenant-bootstrap";
import { MOCK_TENANT_USER_ID } from "@/lib/tenant/mock/tenant-mock";
import {
  getUserProfileVersion,
  getUserProfileView,
  reconcileUserPlatformConnections,
  subscribeUserProfile,
} from "@/lib/user/services/user-profile-service";
import type { UserProfileView } from "@/lib/user/types/user-profile-types";
import { createClient } from "@/lib/supabase/client";

type UserProfileContextValue = {
  profile: UserProfileView;
  isLoaded: boolean;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

async function bootstrapTenantFromSession(): Promise<boolean> {
  const supabase = createClient();
  if (!supabase) {
    return false;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const metadata = user.user_metadata ?? {};
  const fullName =
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    (typeof metadata.name === "string" && metadata.name) ||
    null;

  const authIdentity = {
    userId: user.id,
    email: user.email ?? null,
    fullName,
    avatarUrl:
      (typeof metadata.avatar_url === "string" && metadata.avatar_url) ||
      (typeof metadata.picture === "string" && metadata.picture) ||
      null,
  };

  const liveTenant = await loadLiveTenantContextFromSupabase(authIdentity);
  if (liveTenant) {
    return true;
  }

  loadTenantContextForAuthUser(authIdentity);
  return true;
}

async function reconcileLiveConnectionsFromSession(): Promise<void> {
  const supabase = createClient();
  if (!supabase) {
    reconcileUserPlatformConnections();
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  reconcileUserPlatformConnections({
    gmailConnected: Boolean(session?.provider_token),
    gmailAccountEmail: session?.user?.email ?? null,
  });
}

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastSyncedProfileVersionRef = useRef(-1);

  useEffect(() => {
    let cancelled = false;

    const syncIntegrationsIfProfileChanged = () => {
      const version = getUserProfileVersion();
      if (version === lastSyncedProfileVersionRef.current) {
        return;
      }

      lastSyncedProfileVersionRef.current = version;
      syncIntegrationsFromUserProfile();
    };

    const bootstrap = async () => {
      const hasAuthUser = await bootstrapTenantFromSession();
      if (!hasAuthUser) {
        loadTenantContextForAuthUser({
          userId: MOCK_TENANT_USER_ID,
          email: null,
          fullName: null,
          avatarUrl: null,
        });
      }

      await reconcileLiveConnectionsFromSession();

      if (cancelled) return;

      syncIntegrationsIfProfileChanged();
      setIsLoaded(true);
      setTick((value) => value + 1);
    };

    void bootstrap();

    const unsubscribeProfile = subscribeUserProfile(() => {
      syncIntegrationsIfProfileChanged();
      setTick((value) => value + 1);
    });

    const unsubscribeApple = subscribeAppleCalendarSync(() => {
      const versionBefore = getUserProfileVersion();
      reconcileUserPlatformConnections();
      if (getUserProfileVersion() !== versionBefore) {
        syncIntegrationsIfProfileChanged();
      }
      setTick((value) => value + 1);
    });

    const unsubscribeCalendar = subscribeCalendarPlatform(() => {
      setTick((value) => value + 1);
    });

    return () => {
      cancelled = true;
      unsubscribeProfile();
      unsubscribeApple();
      unsubscribeCalendar();
    };
  }, []);

  const profile = useMemo(() => getUserProfileView(), [tick]);

  const value = useMemo(
    () => ({
      profile,
      isLoaded,
    }),
    [isLoaded, profile]
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfileContext(): UserProfileContextValue {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error(
      "useUserProfileContext must be used within UserProfileProvider"
    );
  }
  return context;
}

export function useUserProfile(): UserProfileView {
  return useUserProfileContext().profile;
}
