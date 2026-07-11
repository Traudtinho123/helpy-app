import {
  MOCK_COMPANY,
  TENANT_COMPANIES,
} from "@/lib/tenant/mock/tenant-mock";
import type { Company } from "@/lib/tenant/types/tenant-types";

export function getCompanyById(companyId: string): Company | null {
  return TENANT_COMPANIES[companyId] ?? null;
}

export function getDefaultCompany(): Company {
  return { ...MOCK_COMPANY };
}
