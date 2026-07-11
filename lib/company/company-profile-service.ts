import {
  MOCK_COMPANY_PROFILE,
  type CompanyDocumentBranding,
  type CompanyProfile,
} from "@/lib/company/company-profile-types";

const COMPANY_PROFILES: Record<string, CompanyProfile> = {
  [MOCK_COMPANY_PROFILE.companyId]: MOCK_COMPANY_PROFILE,
};

const listeners = new Set<() => void>();

let loadedCompanyId: string | null = MOCK_COMPANY_PROFILE.companyId;
let companyProfile: CompanyProfile = { ...MOCK_COMPANY_PROFILE };
let companyProfileSnapshot: CompanyProfile = MOCK_COMPANY_PROFILE;

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeCompanyProfileStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function companyProfileEquals(a: CompanyProfile, b: CompanyProfile): boolean {
  return (
    a.companyId === b.companyId &&
    a.companyName === b.companyName &&
    a.industry === b.industry &&
    a.activePaidSkill === b.activePaidSkill &&
    a.logoInitials === b.logoInitials &&
    a.logoUrl === b.logoUrl &&
    a.primaryColor === b.primaryColor &&
    a.secondaryColor === b.secondaryColor &&
    a.address === b.address &&
    a.phone === b.phone &&
    a.email === b.email &&
    a.website === b.website &&
    a.taxId === b.taxId &&
    a.iban === b.iban &&
    a.defaultVatRate === b.defaultVatRate &&
    a.paymentTerms === b.paymentTerms &&
    a.footer === b.footer &&
    a.documentLanguage === b.documentLanguage &&
    a.companySignature === b.companySignature
  );
}

function recomputeCompanySnapshot(): CompanyProfile {
  if (companyProfileEquals(companyProfileSnapshot, companyProfile)) {
    return companyProfileSnapshot;
  }

  companyProfileSnapshot = { ...companyProfile };
  return companyProfileSnapshot;
}

export function loadCompanyProfileById(companyId: string): CompanyProfile {
  const profile = COMPANY_PROFILES[companyId] ?? MOCK_COMPANY_PROFILE;
  loadedCompanyId = companyId;
  companyProfile = { ...profile };
  recomputeCompanySnapshot();
  notify();
  return getLoadedCompanyProfile();
}

export function getLoadedCompanyId(): string | null {
  return loadedCompanyId;
}

export function getLoadedCompanyProfile(): CompanyProfile {
  return { ...companyProfile };
}

export function getCompanyProfile(): CompanyProfile {
  return getLoadedCompanyProfile();
}

export function getCompanyProfileSnapshot(): CompanyProfile {
  return recomputeCompanySnapshot();
}

export function getCompanyProfileServerSnapshot(): CompanyProfile {
  return MOCK_COMPANY_PROFILE;
}

export function getCompanyNameById(companyId: string): string | null {
  return COMPANY_PROFILES[companyId]?.companyName ?? null;
}

export function updateLoadedCompanyProfile(
  updates: Partial<CompanyProfile>
): CompanyProfile {
  companyProfile = { ...companyProfile, ...updates };
  if (loadedCompanyId) {
    COMPANY_PROFILES[loadedCompanyId] = { ...companyProfile };
  }
  recomputeCompanySnapshot();
  notify();
  return getLoadedCompanyProfile();
}

export function updateCompanyProfile(
  updates: Partial<CompanyProfile>
): CompanyProfile {
  return updateLoadedCompanyProfile(updates);
}

export function resetLoadedCompanyProfile(): CompanyProfile {
  return loadCompanyProfileById(MOCK_COMPANY_PROFILE.companyId);
}

export function resetCompanyProfile(): CompanyProfile {
  return resetLoadedCompanyProfile();
}

export function getCompanyDocumentBranding(): CompanyDocumentBranding {
  const profile = getCompanyProfile();

  return {
    profile,
    senderLine: profile.companyName,
    contactBlock: [
      profile.address,
      profile.phone,
      profile.email,
      profile.website,
    ],
    legalBlock: [profile.taxId, `IBAN: ${profile.iban}`],
  };
}
