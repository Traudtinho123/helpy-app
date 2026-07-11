"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSkillAccessContext } from "@/components/auth/skill-access-provider";
import { AUTH_ROUTES } from "@/lib/auth/routes";

const EXCLUDED_PATHS = [
  AUTH_ROUTES.login,
  AUTH_ROUTES.register,
  AUTH_ROUTES.callback,
  AUTH_ROUTES.pendingAccess,
];

function shouldEnforceSkillAccess(pathname: string): boolean {
  return !EXCLUDED_PATHS.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Leitet Nutzer ohne freigeschalteten Skill auf /zugang-ausstehend.
 * Kein Produkt-Picker mehr — Skill kommt nur aus der DB.
 */
export function SubscriptionSkillGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasAccess, loading } = useSkillAccessContext();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!hasAccess && shouldEnforceSkillAccess(pathname)) {
      router.replace(AUTH_ROUTES.pendingAccess);
      return;
    }

    if (hasAccess && pathname === AUTH_ROUTES.pendingAccess) {
      router.replace(AUTH_ROUTES.home);
      return;
    }

    setReady(true);
  }, [hasAccess, loading, pathname, router]);

  if (loading || !ready) {
    if (
      pathname === AUTH_ROUTES.login ||
      pathname === AUTH_ROUTES.register ||
      pathname === AUTH_ROUTES.pendingAccess
    ) {
      return <>{children}</>;
    }

    return (
      <div className="flex min-h-full items-center justify-center bg-[#EEF4FC] text-[13px] text-[#64748B]">
        Zugang wird geprüft…
      </div>
    );
  }

  return <>{children}</>;
}
