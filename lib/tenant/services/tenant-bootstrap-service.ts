import { ensureCompanyKnowledgeLoaded } from "@/features/company-knowledge/services/company-knowledge-service";
import {
  loadCompanyProfileById,
  updateLoadedCompanyProfile,
} from "@/lib/company/company-profile-service";
import { getCompanyById, getDefaultCompany } from "@/lib/tenant/services/company-service";
import {
  getCompanySettingsByCompanyId,
  getDefaultCompanySettings,
} from "@/lib/tenant/services/company-settings-service";
import { getUserConnectionsByUserId } from "@/lib/tenant/services/user-connections-service";
import {
  getDefaultUserProfile,
  getUserProfileByUserId,
} from "@/lib/tenant/services/user-profile-tenant-service";
import type {
  SupabaseAuthIdentity,
  TenantContext,
  TenantUserRole,
} from "@/lib/tenant/types/tenant-types";
import type { UserRole } from "@/lib/user/types/user-profile-types";
import {
  hydrateUserProfileFromAuth,
  reconcileUserPlatformConnections,
  updateUserProfile,
} from "@/lib/user/services/user-profile-service";

function mapTenantRoleToLegacyRole(role: TenantUserRole): UserRole {
  switch (role) {
    case "OWNER":
      return "owner";
    case "ADMIN":
      return "admin";
    case "EMPLOYEE":
      return "member";
  }
}

function applyLegacyCompanyProfile(tenant: TenantContext): void {
  loadCompanyProfileById(tenant.company.id);
  updateLoadedCompanyProfile({
    companyId: tenant.company.id,
    companyName: tenant.company.companyName,
    industry: tenant.company.industry,
    activePaidSkill: tenant.company.activeHelpyProfile,
    logoInitials: tenant.companySettings.branding.logoInitials,
    logoUrl: tenant.companySettings.logo,
    primaryColor: tenant.companySettings.branding.primaryColor,
    secondaryColor: tenant.companySettings.branding.secondaryColor,
    documentTemplates: tenant.companySettings.emailTemplates,
    defaultWorkingHours: tenant.companySettings.workingHours,
    defaultPlatforms: tenant.companySettings.activePlatforms,
  });
}

/**
 * Login-Flow (Mock):
 * Supabase User → user_profile (userId) → companyId → company + company_settings
 *
 * WICHTIG: companyId wird NIE aus der Gmail-/Auth-E-Mail abgeleitet.
 */
export function bootstrapTenantFromAuthUser(
  auth: SupabaseAuthIdentity
): TenantContext {
  const userProfile =
    getUserProfileByUserId(auth.userId) ??
    getDefaultUserProfile(auth.userId);

  const company =
    getCompanyById(userProfile.companyId) ??
    getDefaultCompany();

  const userConnections = getUserConnectionsByUserId(auth.userId);

  const companySettings =
    getCompanySettingsByCompanyId(userProfile.companyId) ??
    getDefaultCompanySettings(userProfile.companyId);

  return {
    userProfile: {
      ...userProfile,
      fullName: auth.fullName ?? userProfile.fullName,
      avatar: auth.avatarUrl ?? userProfile.avatar,
    },
    company,
    userConnections,
    companySettings,
  };
}

/** Wendet Tenant-Kontext auf bestehende Client-Stores an — keine UI-Änderung. */
export function applyTenantContextToLegacyStores(
  tenant: TenantContext,
  auth: SupabaseAuthIdentity
): void {
  hydrateUserProfileFromAuth({
    userId: tenant.userProfile.userId,
    email: auth.email,
    name: tenant.userProfile.fullName,
    avatarUrl: tenant.userProfile.avatar,
  });

  updateUserProfile({
    companyId: tenant.userProfile.companyId,
    role: mapTenantRoleToLegacyRole(tenant.userProfile.role),
    notificationSettings: tenant.companySettings.notificationSettings,
  });

  reconcileUserPlatformConnections({
    gmailConnected: tenant.userConnections.gmailConnected,
    gmailAccountEmail: auth.email,
  });

  applyLegacyCompanyProfile(tenant);
  void ensureCompanyKnowledgeLoaded(tenant.company.id);
}

export function loadTenantContextForAuthUser(
  auth: SupabaseAuthIdentity
): TenantContext {
  const tenant = bootstrapTenantFromAuthUser(auth);
  applyTenantContextToLegacyStores(tenant, auth);
  return tenant;
}
