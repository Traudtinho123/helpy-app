import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchCompanyProfile } from "@/lib/company/company-profile-repository";
import {
  getCompanyProfileSnapshot,
  loadCompanyProfileById,
} from "@/lib/company/company-profile-service";
import type { CompanyProfile } from "@/lib/company/company-profile-types";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function resolveCompanyProfileForServer(
  supabase: SupabaseClient | null,
  companyId: string | null | undefined
): Promise<CompanyProfile> {
  if (companyId && supabase && isSupabaseConfigured()) {
    try {
      const profile = await fetchCompanyProfile(supabase, companyId);
      if (profile) {
        loadCompanyProfileById(profile.companyId, profile);
        return profile;
      }
    } catch (error) {
      console.error(
        "[company-profile-server] load failed:",
        error instanceof Error ? error.message : error
      );
    }
  }

  return getCompanyProfileSnapshot();
}
