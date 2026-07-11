import { RegisterForm } from "@/components/auth/register-form";
import { redirectIfAuthenticated } from "@/lib/auth/require-auth";

export default async function RegistrierenPage() {
  await redirectIfAuthenticated();

  return <RegisterForm />;
}
