export {
  DOCUMENT_LANGUAGE_LABELS,
  getCompanyDocumentBranding,
  getCompanyProfile,
  MOCK_COMPANY_PROFILE,
  resetCompanyProfile,
  updateCompanyProfile,
} from "@/lib/company/company-profile";

export {
  getCompanyNameById,
  getCompanyProfileServerSnapshot,
  getCompanyProfileSnapshot,
  getLoadedCompanyId,
  getLoadedCompanyProfile,
  loadCompanyProfileById,
  subscribeCompanyProfileStore,
  updateLoadedCompanyProfile,
} from "@/lib/company/company-profile-service";

export type {
  CompanyDocumentBranding,
  CompanyProfile,
  DocumentLanguage,
  TeamSettings,
  WorkingHours,
} from "@/lib/company/company-profile-types";
