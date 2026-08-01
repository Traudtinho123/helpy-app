import type { SupabaseClient } from "@supabase/supabase-js";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import {
  companyProfileToRowPatch,
  companyRowToProfile,
  type CompanyProfileRow,
} from "@/lib/company/company-profile-mapper";
import type { CompanyProfile } from "@/lib/company/company-profile-types";

const COMPANY_PROFILE_COLUMNS =
  "id, name, industry, phone, website, email, address, city, zip, iban, mwst_nummer, logo_url, profile_settings";

export async function fetchCompanyProfileRow(
  supabase: SupabaseClient,
  companyId: string
): Promise<CompanyProfileRow | null> {
  const { data, error } = await supabase
    .from("companies")
    .select(COMPANY_PROFILE_COLUMNS)
    .eq("id", companyId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as CompanyProfileRow | null) ?? null;
}

export async function fetchCompanyProfile(
  supabase: SupabaseClient,
  companyId: string,
  options: { activePaidSkill?: HelpySkill } = {}
): Promise<CompanyProfile | null> {
  const row = await fetchCompanyProfileRow(supabase, companyId);
  if (!row) return null;
  return companyRowToProfile(row, options);
}

export async function upsertCompanyProfileRow(
  supabase: SupabaseClient,
  profile: CompanyProfile
): Promise<CompanyProfileRow> {
  const patch = companyProfileToRowPatch(profile);

  const { data, error } = await supabase
    .from("companies")
    .update(patch as never)
    .eq("id", profile.companyId)
    .select(COMPANY_PROFILE_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CompanyProfileRow;
}
