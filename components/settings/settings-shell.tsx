"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { usePermissions } from "@/components/auth/permissions-provider";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  MOBILE_SETTINGS_NAV_ITEMS,
  resolveCoreNavActiveHref,
  resolveSettingsNavActiveHref,
  SETTINGS_NAV_ITEMS,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SettingsShellProps = {
  children: React.ReactNode;
  title: string;
  description: string;
};

export function SettingsShell({
  children,
  title,
  description,
}: SettingsShellProps) {
  const pathname = usePathname() ?? "/einstellungen/unternehmen";
  const settingsActiveHref = resolveSettingsNavActiveHref(pathname);
  const mainActiveHref = resolveCoreNavActiveHref(pathname);
  const { permissions } = usePermissions();
  const [isOperator, setIsOperator] = useState(false);

  useEffect(() => {
    void fetch("/api/operator/status", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { isOperator?: boolean } | null) => {
        setIsOperator(Boolean(data?.isOperator));
      })
      .catch(() => setIsOperator(false));
  }, []);

  const navItems = SETTINGS_NAV_ITEMS.filter((item) => {
    if (item.operatorOnly && !isOperator) return false;
    if (item.superAdminOnly && !permissions?.isSuperAdmin) return false;
    return true;
  });

  const mobileNavItems = MOBILE_SETTINGS_NAV_ITEMS.filter((item) => {
    if (item.operatorOnly && !isOperator) return false;
    if (item.superAdminOnly && !permissions?.isSuperAdmin) return false;
    return true;
  });

  return (
    <DashboardShell activeHref={mainActiveHref}>
      <div className="flex h-full min-h-0">
        <aside className="hidden w-[240px] shrink-0 border-r border-[var(--border)] bg-[var(--bg-surface)] backdrop-blur-xl lg:block">
          <div className="border-b border-[var(--border)] px-5 py-5">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-[var(--text-secondary)] uppercase">
              Einstellungen
            </p>
            <h1 className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
              System
            </h1>
          </div>
          <nav className="space-y-0.5 p-3">
            {navItems.map(({ label, href, emoji }) => {
              const isActive = settingsActiveHref === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-[13px] font-medium transition-all duration-300",
                    isActive
                      ? "bg-[var(--accent-light)] text-[var(--accent)] ring-1 ring-[#BFDBFE]/60"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <span className="text-[14px]">{emoji}</span>
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="border-b border-[var(--border)] bg-[var(--bg-surface)] lg:hidden">
            <div className="px-4 py-4">
              <Link
                href="/einstellungen"
                className="mb-3 inline-flex min-h-[44px] items-center text-[13px] font-medium text-[var(--accent)]"
              >
                ← Alle Einstellungen
              </Link>
              <p className="text-[11px] font-semibold tracking-[0.08em] text-[var(--text-secondary)] uppercase">
                Einstellungen
              </p>
              <h2 className="mt-0.5 text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                {title}
              </h2>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{description}</p>
            </div>

            <nav className="flex gap-2 overflow-x-auto border-t border-[var(--border)] px-4 py-3">
              {mobileNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href.includes("#") &&
                    pathname === item.href.split("#")[0]) ||
                  settingsActiveHref === item.href;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[12px] font-medium transition-colors",
                      isActive
                        ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                    )}
                  >
                    <span>{item.emoji}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="hidden border-b border-[var(--border)] bg-[var(--bg-surface)] px-6 py-5 lg:block lg:px-8">
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              {title}
            </h2>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{description}</p>
          </div>

          <div className="px-4 py-6 lg:px-8">{children}</div>
        </div>
      </div>
    </DashboardShell>
  );
}
