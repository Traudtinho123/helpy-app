"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { usePermissions } from "@/components/auth/permissions-provider";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
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

  return (
    <DashboardShell activeHref={mainActiveHref}>
      <div className="flex h-full min-h-0">
        <aside className="hidden w-[240px] shrink-0 border-r border-[#CBD5E1]/50 bg-white/60 backdrop-blur-xl lg:block">
          <div className="border-b border-[#CBD5E1]/40 px-5 py-5">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-[#64748B] uppercase">
              Einstellungen
            </p>
            <h1 className="mt-1 text-sm font-semibold text-[#0F172A]">
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
                      ? "bg-[#EFF6FF] text-[#2563EB] ring-1 ring-[#BFDBFE]/60"
                      : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
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
          <div className="border-b border-[#CBD5E1]/50 bg-white/70 px-6 py-5 lg:px-8">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-[#64748B] uppercase lg:hidden">
              Einstellungen
            </p>
            <h2 className="mt-0.5 text-xl font-semibold tracking-[-0.02em] text-[#0F172A] lg:mt-0">
              {title}
            </h2>
            <p className="mt-1 text-[13px] text-[#64748B]">{description}</p>
          </div>
          <div className="px-6 py-6 lg:px-8">{children}</div>
        </div>
      </div>
    </DashboardShell>
  );
}
