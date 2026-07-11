import {
  MOCK_COMPANY_SETTINGS,
  TENANT_COMPANY_SETTINGS,
} from "@/lib/tenant/mock/tenant-mock";
import type { CompanySettings } from "@/lib/tenant/types/tenant-types";

export function getCompanySettingsByCompanyId(
  companyId: string
): CompanySettings | null {
  const direct = TENANT_COMPANY_SETTINGS[companyId];
  if (direct) {
    return { ...direct };
  }

  return null;
}

export function getDefaultCompanySettings(companyId: string): CompanySettings {
  return {
    ...MOCK_COMPANY_SETTINGS,
    companyId,
  };
}
