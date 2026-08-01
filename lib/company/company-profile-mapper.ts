import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import {
  MOCK_COMPANY_PROFILE,
  type CompanyProfile,
  type DocumentLanguage,
  type TeamSettings,
  type WorkingHours,
} from "@/lib/company/company-profile-types";
import type { Json } from "@/lib/database/types";

export type CompanyProfileRow = {
  id: string;
  name: string;
  industry: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  iban: string | null;
  mwst_nummer: string | null;
  logo_url: string | null;
  profile_settings: Json | null;
};

type ProfileSettingsJson = {
  logoInitials?: string;
  primaryColor?: string;
  secondaryColor?: string;
  defaultVatRate?: number;
  paymentTerms?: string;
  footer?: string;
  documentLanguage?: DocumentLanguage;
  companySignature?: string;
  documentTemplates?: string[];
  defaultWorkingHours?: WorkingHours;
  defaultPlatforms?: string[];
  teamSettings?: TeamSettings;
  activePaidSkill?: HelpySkill;
};

function parseProfileSettings(raw: Json | null): ProfileSettingsJson {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as ProfileSettingsJson;
}

function safeString(value: string | null | undefined, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function buildAddressLine(
  address: string | null,
  zip: string | null,
  city: string | null
): string {
  const street = safeString(address);
  const location = [safeString(zip), safeString(city)].filter(Boolean).join(" ");
  if (street && location) return `${street}, ${location}`;
  return street || location;
}

export function companyRowToProfile(
  row: CompanyProfileRow,
  options: { activePaidSkill?: HelpySkill } = {}
): CompanyProfile {
  const settings = parseProfileSettings(row.profile_settings);
  const fallback = MOCK_COMPANY_PROFILE;

  return {
    companyId: row.id,
    companyName: safeString(row.name, fallback.companyName),
    industry: safeString(row.industry, fallback.industry),
    activePaidSkill:
      options.activePaidSkill ??
      settings.activePaidSkill ??
      fallback.activePaidSkill,
    logoInitials: safeString(settings.logoInitials, fallback.logoInitials),
    logoUrl: row.logo_url ?? null,
    primaryColor: safeString(settings.primaryColor, fallback.primaryColor),
    secondaryColor: safeString(settings.secondaryColor, fallback.secondaryColor),
    documentTemplates:
      settings.documentTemplates ?? fallback.documentTemplates,
    defaultWorkingHours:
      settings.defaultWorkingHours ?? fallback.defaultWorkingHours,
    companySignature:
      safeString(settings.companySignature, fallback.companySignature),
    defaultPlatforms: settings.defaultPlatforms ?? fallback.defaultPlatforms,
    teamSettings: settings.teamSettings ?? fallback.teamSettings,
    address: buildAddressLine(row.address, row.zip, row.city) || fallback.address,
    phone: safeString(row.phone, fallback.phone),
    email: safeString(row.email, fallback.email),
    website: safeString(row.website, fallback.website),
    taxId: safeString(row.mwst_nummer, fallback.taxId),
    iban: safeString(row.iban, fallback.iban),
    defaultVatRate:
      typeof settings.defaultVatRate === "number"
        ? settings.defaultVatRate
        : fallback.defaultVatRate,
    paymentTerms: safeString(settings.paymentTerms, fallback.paymentTerms),
    footer: safeString(settings.footer, fallback.footer),
    documentLanguage:
      settings.documentLanguage === "de" ||
      settings.documentLanguage === "en" ||
      settings.documentLanguage === "fr"
        ? settings.documentLanguage
        : fallback.documentLanguage,
  };
}

function splitAddressParts(address: string): {
  address: string | null;
  zip: string | null;
  city: string | null;
} {
  const trimmed = address.trim();
  if (!trimmed) {
    return { address: null, zip: null, city: null };
  }

  const match = trimmed.match(/^(.+?),\s*(\d{4,5})\s+(.+)$/);
  if (match) {
    return {
      address: match[1]?.trim() || trimmed,
      zip: match[2]?.trim() ?? null,
      city: match[3]?.trim() ?? null,
    };
  }

  return { address: trimmed, zip: null, city: null };
}

export function companyProfileToRowPatch(
  profile: CompanyProfile
): Partial<CompanyProfileRow> {
  const addressParts = splitAddressParts(profile.address);

  const profileSettings: ProfileSettingsJson = {
    logoInitials: profile.logoInitials,
    primaryColor: profile.primaryColor,
    secondaryColor: profile.secondaryColor,
    defaultVatRate: profile.defaultVatRate,
    paymentTerms: profile.paymentTerms,
    footer: profile.footer,
    documentLanguage: profile.documentLanguage,
    companySignature: profile.companySignature,
    documentTemplates: profile.documentTemplates,
    defaultWorkingHours: profile.defaultWorkingHours,
    defaultPlatforms: profile.defaultPlatforms,
    teamSettings: profile.teamSettings,
    activePaidSkill: profile.activePaidSkill,
  };

  return {
    name: profile.companyName.trim(),
    industry: profile.industry.trim() || null,
    phone: profile.phone.trim() || null,
    website: profile.website.trim() || null,
    email: profile.email.trim() || null,
    address: addressParts.address,
    zip: addressParts.zip,
    city: addressParts.city,
    iban: profile.iban.trim() || null,
    mwst_nummer: profile.taxId.trim() || null,
    logo_url: profile.logoUrl,
    profile_settings: profileSettings as unknown as Json,
  };
}
