"use client";

import { useEffect } from "react";
import { initNotificationStore, teardownNotificationStore } from "@/features/notifications/services/notification-store";
import { useUserProfileContext } from "@/lib/user/components/user-profile-context";

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, isLoaded } = useUserProfileContext();

  useEffect(() => {
    if (!isLoaded || !profile.companyId) return;

    initNotificationStore(profile.companyId);
    return () => {
      teardownNotificationStore();
    };
  }, [isLoaded, profile.companyId]);

  return children;
}
