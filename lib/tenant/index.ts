export type {
  Company,
  CompanyBranding,
  CompanySettings,
  ConnectionStatus,
  SupabaseAuthIdentity,
  TenantContext,
  TenantNotificationSettings,
  TenantUserProfile,
  TenantUserRole,
  UserConnections,
} from "@/lib/tenant/types/tenant-types";

export {
  MOCK_COMPANY,
  MOCK_COMPANY_SETTINGS,
  MOCK_TENANT_USER_ID,
  MOCK_TENANT_USER_PROFILE,
  MOCK_USER_CONNECTIONS,
} from "@/lib/tenant/mock/tenant-mock";

export { getCompanyById, getDefaultCompany } from "@/lib/tenant/services/company-service";
export {
  getCompanySettingsByCompanyId,
  getDefaultCompanySettings,
} from "@/lib/tenant/services/company-settings-service";
export {
  getDefaultUserProfile,
  getUserProfileByUserId,
} from "@/lib/tenant/services/user-profile-tenant-service";
export {
  getUserConnectionsByUserId,
  updateUserConnections,
} from "@/lib/tenant/services/user-connections-service";
export {
  applyTenantContextToLegacyStores,
  bootstrapTenantFromAuthUser,
  loadTenantContextForAuthUser,
} from "@/lib/tenant/services/tenant-bootstrap-service";
