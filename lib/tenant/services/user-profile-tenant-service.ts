import {
  MOCK_TENANT_USER_PROFILE,
  TENANT_USER_PROFILES,
} from "@/lib/tenant/mock/tenant-mock";
import type { TenantUserProfile } from "@/lib/tenant/types/tenant-types";

/**
 * Lädt user_profile ausschließlich über userId.
 * E-Mail wird NICHT zur Mandanten-Erkennung verwendet.
 */
export function getUserProfileByUserId(userId: string): TenantUserProfile | null {
  const direct = TENANT_USER_PROFILES[userId];
  if (direct) {
    return { ...direct };
  }

  // Erster Login mit echter Supabase-UUID: Demo-Mandant zuweisen, userId übernehmen.
  if (userId && userId !== MOCK_TENANT_USER_PROFILE.userId) {
    return {
      ...MOCK_TENANT_USER_PROFILE,
      userId,
      avatar: MOCK_TENANT_USER_PROFILE.avatar,
    };
  }

  return null;
}

export function getDefaultUserProfile(userId: string): TenantUserProfile {
  return {
    ...MOCK_TENANT_USER_PROFILE,
    userId,
  };
}
