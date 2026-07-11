export {
  DOCUMENT_LANGUAGE_LABELS,
  MOCK_COMPANY_PROFILE,
} from "@/lib/company/company-profile-types";

export type {
  CompanyDocumentBranding,
  CompanyProfile,
  DocumentLanguage,
  TeamSettings,
  WorkingHours,
} from "@/lib/company/company-profile-types";

export {
  getCompanyDocumentBranding,
  getCompanyProfile,
  resetCompanyProfile,
  updateCompanyProfile,
} from "@/lib/company/company-profile-service";
