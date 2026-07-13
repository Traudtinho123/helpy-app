import { RegisterOnboardingPage } from "@/components/auth/register-onboarding-page";
import { redirectIfAuthenticated } from "@/lib/auth/require-auth";

export default async function RegistrierenPage() {
  await redirectIfAuthenticated();

  return <RegisterOnboardingPage />;
}
