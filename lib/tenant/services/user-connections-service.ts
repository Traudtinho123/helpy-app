import {
  MOCK_USER_CONNECTIONS,
  TENANT_USER_CONNECTIONS,
} from "@/lib/tenant/mock/tenant-mock";
import type { UserConnections } from "@/lib/tenant/types/tenant-types";

/** Persönliche Plattformverbindungen — immer pro userId. */
export function getUserConnectionsByUserId(userId: string): UserConnections {
  const direct = TENANT_USER_CONNECTIONS[userId];
  if (direct) {
    return { ...direct };
  }

  return {
    ...MOCK_USER_CONNECTIONS,
    userId,
  };
}

export function updateUserConnections(
  userId: string,
  patch: Partial<Omit<UserConnections, "userId">>
): UserConnections {
  const current = getUserConnectionsByUserId(userId);
  const next = { ...current, ...patch, userId };
  TENANT_USER_CONNECTIONS[userId] = next;
  return { ...next };
}
