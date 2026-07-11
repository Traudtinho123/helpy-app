import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { PendingAccessContent } from "@/components/auth/pending-access-content";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { getSkillAccessForCurrentUser } from "@/lib/auth/skill-access";
import { redirect } from "next/navigation";

export default async function PendingAccessPage() {
  const access = await getSkillAccessForCurrentUser();

  if (!access.userId && access.source !== "dev-fallback") {
    redirect(AUTH_ROUTES.login);
  }

  if (access.hasAccess) {
    redirect(AUTH_ROUTES.home);
  }

  return (
    <AuthPageShell
      title="Zugang wird eingerichtet"
      subtitle="Dein Konto ist angelegt — die Freischaltung deines HELPY-Pakets steht noch aus."
    >
      <PendingAccessContent email={access.email} />
    </AuthPageShell>
  );
}
