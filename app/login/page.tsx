import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { redirectIfAuthenticated } from "@/lib/auth/require-auth";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
