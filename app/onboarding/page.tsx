import { redirect } from "next/navigation";
import { onboardingStepPath, nextOnboardingStepAfter } from "@/lib/onboarding/constants";
import { fetchOnboardingStateForUser } from "@/lib/onboarding/onboarding-repository";
import { createClient } from "@/lib/supabase/server";
import { AUTH_ROUTES } from "@/lib/auth/routes";

export default async function OnboardingIndexPage() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) redirect(AUTH_ROUTES.login);

  const state = await fetchOnboardingStateForUser(user.id);
  if (!state || state.onboardingCompleted) redirect(AUTH_ROUTES.home);

  redirect(onboardingStepPath(nextOnboardingStepAfter(state.onboardingStep)));
}
