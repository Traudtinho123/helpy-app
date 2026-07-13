import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type OnboardingCompanyState = {
  companyId: string;
  companyName: string;
  industry: string | null;
  onboardingCompleted: boolean;
  onboardingStep: number;
  onboardingCompletedAt: string | null;
  vorname: string | null;
};

const devOnboarding = new Map<
  string,
  { step: number; completed: boolean; completedAt: string | null }
>();

export async function fetchOnboardingStateForUser(
  userId: string
): Promise<OnboardingCompanyState | null> {
  if (!isSupabaseConfigured()) {
    const dev = devOnboarding.get(userId) ?? { step: 0, completed: false, completedAt: null };
    return {
      companyId: "dev-company",
      companyName: "Demo Firma",
      industry: "Immobilien",
      onboardingCompleted: dev.completed,
      onboardingStep: dev.step,
      onboardingCompletedAt: dev.completedAt,
      vorname: "Viktor",
    };
  }

  const supabase = await createClient();
  if (!supabase) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, vorname")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.company_id) return null;

  const { data: company } = await supabase
    .from("companies")
    .select(
      "id, name, industry, onboarding_completed, onboarding_step, onboarding_completed_at"
    )
    .eq("id", profile.company_id)
    .maybeSingle();

  if (!company) return null;

  return {
    companyId: company.id,
    companyName: company.name,
    industry: company.industry,
    onboardingCompleted: Boolean(company.onboarding_completed),
    onboardingStep: company.onboarding_step ?? 0,
    onboardingCompletedAt: company.onboarding_completed_at,
    vorname: profile.vorname,
  };
}

export async function updateOnboardingState(input: {
  companyId: string;
  onboardingStep?: number;
  onboardingCompleted?: boolean;
  companyName?: string;
  industry?: string;
}): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) {
    return true;
  }

  const admin = createAdminClient();
  if (!admin) return false;

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.onboardingStep !== undefined) {
    patch.onboarding_step = input.onboardingStep;
  }
  if (input.onboardingCompleted !== undefined) {
    patch.onboarding_completed = input.onboardingCompleted;
    if (input.onboardingCompleted) {
      patch.onboarding_completed_at = new Date().toISOString();
    }
  }
  if (input.companyName !== undefined) patch.name = input.companyName;
  if (input.industry !== undefined) patch.industry = input.industry;

  const { error } = await admin
    .from("companies")
    .update(patch as never)
    .eq("id", input.companyId);

  return !error;
}

export async function recordEmailNotification(input: {
  companyId: string;
  type: string;
  recipient: string;
}): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;

  const admin = createAdminClient();
  if (!admin) return;

  await admin.from("email_notifications").insert({
    company_id: input.companyId,
    type: input.type,
    recipient: input.recipient,
  } as never);
}
