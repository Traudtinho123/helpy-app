import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import { normalizeAllowedSkills } from "@/lib/auth/skill-access-shared";
import {
  fetchCompanySkillsFromDb,
  fetchProfileAccessRow,
  fetchUserRoleFromDb,
  getAllPlatformSkills,
  type HelpyUserRole,
} from "@/lib/auth/permissions-repository";

export type { HelpyUserRole } from "@/lib/auth/permissions-repository";

export type UserPermissionsSnapshot = {
  userId: string;
  companyId: string | null;
  role: HelpyUserRole;
  isSuperAdmin: boolean;
  canEditAISettings: boolean;
  canInviteUsers: boolean;
  canSwitchSkill: boolean;
  availableSkills: HelpySkill[];
  profileAllowedSkills: HelpySkill[];
};

export async function getUserRole(
  userId: string,
  companyId: string | null
): Promise<HelpyUserRole> {
  return fetchUserRoleFromDb(userId, companyId);
}

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const profile = await fetchProfileAccessRow(userId);
  if (!profile) return false;
  if (profile.isSuperAdmin) return true;
  const role = await fetchUserRoleFromDb(userId, profile.companyId);
  return role === "super_admin";
}

export async function canEditAISettings(
  userId: string,
  companyId: string | null
): Promise<boolean> {
  const role = await getUserRole(userId, companyId);
  return role === "super_admin" || role === "admin";
}

export async function canInviteUsers(
  userId: string,
  companyId: string | null
): Promise<boolean> {
  const role = await getUserRole(userId, companyId);
  return role === "super_admin" || role === "admin";
}

export async function canSwitchSkill(userId: string): Promise<boolean> {
  return isSuperAdmin(userId);
}

export async function getAvailableSkills(
  userId: string,
  companyId: string | null
): Promise<HelpySkill[]> {
  if (await isSuperAdmin(userId)) {
    return getAllPlatformSkills();
  }

  if (!companyId) return [];

  const companySkills = await fetchCompanySkillsFromDb(companyId);
  const active = companySkills
    .filter((item) => item.isActive)
    .map((item) => item.skill);

  if (active.length > 0) {
    return normalizeAllowedSkills(active);
  }

  const profile = await fetchProfileAccessRow(userId);
  return normalizeAllowedSkills(profile?.allowedSkills ?? []);
}

export async function getUserPermissionsSnapshot(
  userId: string
): Promise<UserPermissionsSnapshot | null> {
  const profile = await fetchProfileAccessRow(userId);
  if (!profile) return null;

  const role = await fetchUserRoleFromDb(userId, profile.companyId);
  const isSuper = role === "super_admin" || profile.isSuperAdmin;
  const availableSkills = await getAvailableSkills(userId, profile.companyId);
  const profileAllowedSkills = normalizeAllowedSkills(profile.allowedSkills);

  return {
    userId,
    companyId: profile.companyId,
    role: isSuper ? "super_admin" : role,
    isSuperAdmin: isSuper,
    canEditAISettings: isSuper || role === "admin",
    canInviteUsers: isSuper || role === "admin",
    canSwitchSkill: isSuper,
    availableSkills,
    profileAllowedSkills,
  };
}
