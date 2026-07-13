import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/features/onboarding/components/onboarding-flow";
import { parseOnboardingStep, onboardingStepPath } from "@/lib/onboarding/constants";
import { fetchOnboardingStateForUser } from "@/lib/onboarding/onboarding-repository";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type PageProps = {
  params: Promise<{ step: string }>;
};

export default async function OnboardingStepPage({ params }: PageProps) {
  const { step: stepParam } = await params;
  const step = parseOnboardingStep(`/onboarding/schritt-${stepParam}`);

  if (!step) {
    redirect(onboardingStepPath(1));
  }

  if (!isSupabaseConfigured()) {
    return (
      <OnboardingFlow
        step={step}
        vorname="Viktor"
        companyName="Demo Firma"
      />
    );
  }

  const supabase = await createClient();
  if (!supabase) redirect(AUTH_ROUTES.login);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(AUTH_ROUTES.login);

  const state = await fetchOnboardingStateForUser(user.id);
  if (!state) redirect(AUTH_ROUTES.login);

  if (state.onboardingCompleted) {
    redirect(AUTH_ROUTES.home);
  }

  return (
    <OnboardingFlow
      step={step}
      vorname={state.vorname}
      companyName={state.companyName}
    />
  );
}
