import {
  MOCK_COMPANY_PROFILE,
  type CompanyDocumentBranding,
  type CompanyProfile,
} from "@/lib/company/company-profile-types";
import {
  fetchCompanyProfileFromApi,
  saveCompanyProfileToApi,
  type CompanyProfileSaveResult,
} from "@/lib/company/company-profile-client";

const COMPANY_PROFILES: Record<string, CompanyProfile> = {
  [MOCK_COMPANY_PROFILE.companyId]: MOCK_COMPANY_PROFILE,
};

const listeners = new Set<() => void>();

let loadedCompanyId: string | null = MOCK_COMPANY_PROFILE.companyId;
let companyProfile: CompanyProfile = { ...MOCK_COMPANY_PROFILE };
let companyProfileSnapshot: CompanyProfile = MOCK_COMPANY_PROFILE;
let hydrationError: string | null = null;
let isHydrating = false;

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

export function loadCompanyProfileById(
  companyId: string,
  profileOverride?: CompanyProfile
): CompanyProfile {
  const profile =
    profileOverride ??
    COMPANY_PROFILES[companyId] ??
    ({ ...MOCK_COMPANY_PROFILE, companyId } satisfies CompanyProfile);

  loadedCompanyId = companyId;
  companyProfile = { ...profile, companyId };
  COMPANY_PROFILES[companyId] = { ...companyProfile };
  hydrationError = null;
  recomputeCompanySnapshot();
  notify();
  return getLoadedCompanyProfile();
}

export async function hydrateCompanyProfileFromApi(
  companyId: string
): Promise<
  | { ok: true; profile: CompanyProfile }
  | { ok: false; error: string }
> {
  if (typeof window === "undefined") {
    return { ok: false, error: "Nur im Browser verfügbar." };
  }

  isHydrating = true;
  hydrationError = null;
  notify();

  const result = await fetchCompanyProfileFromApi();
  isHydrating = false;

  if (!result.ok) {
    hydrationError = result.error;
    loadCompanyProfileById(companyId);
    notify();
    return result;
  }

  const profile = loadCompanyProfileById(companyId, {
    ...result.profile,
    companyId,
  });
  notify();
  return { ok: true, profile };
}

export async function persistCompanyProfile(
  profile: CompanyProfile
): Promise<CompanyProfileSaveResult> {
  const result = await saveCompanyProfileToApi(profile);
  if (result.ok) {
    loadCompanyProfileById(result.profile.companyId, result.profile);
  }
  return result;
}

export function getCompanyProfileHydrationState(): {
  isHydrating: boolean;
  error: string | null;
} {
  return { isHydrating, error: hydrationError };
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
