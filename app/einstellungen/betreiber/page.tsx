import { redirect } from "next/navigation";
import { OperatorAccessPanel } from "@/components/settings/operator-access-panel";
import { AUTH_ROUTES } from "@/lib/auth/routes";
import { requireSkillAccessPage } from "@/lib/auth/require-skill-access";
import { getPlatformOperatorSnapshot } from "@/lib/auth/platform-operator";

export default async function OperatorSettingsPage() {
  await requireSkillAccessPage();

  const operator = await getPlatformOperatorSnapshot();
  if (!operator.isOperator) {
    redirect(AUTH_ROUTES.home);
  }

  return <OperatorAccessPanel />;
}
