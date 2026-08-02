"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { usePermissions } from "@/components/auth/permissions-provider";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MOBILE_SETTINGS_NAV_ITEMS } from "@/lib/navigation/mobile-navigation";
import { cn } from "@/lib/utils";

export function SettingsHub() {
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

  const items = MOBILE_SETTINGS_NAV_ITEMS.filter((item) => {
    if (item.operatorOnly && !isOperator) return false;
    if (item.superAdminOnly && !permissions?.isSuperAdmin) return false;
    return true;
  });

  return (
    <DashboardShell activeHref="/einstellungen">
      <div className="mx-auto max-w-lg px-4 py-6 lg:max-w-2xl lg:px-8 lg:py-10">
        <header className="mb-6 lg:mb-8">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-[var(--text-secondary)] uppercase">
            System
          </p>
          <h1 className="mt-1 text-[1.5rem] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            Einstellungen
          </h1>
          <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
            Verwalte Unternehmen, Verbindungen und Team.
          </p>
        </header>

        <nav className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--bg-surface)]">
          {items.map((item, index) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                "flex min-h-[52px] items-center gap-3 px-4 py-3 text-[15px] font-medium text-[var(--text-primary)] transition-colors active:bg-[var(--accent-light)]",
                index > 0 && "border-t border-[var(--border)]"
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--bg-elevated)] text-lg">
                {item.emoji}
              </span>
              <span className="min-w-0 flex-1">{item.label}</span>
              <ChevronRight className="size-4 shrink-0 text-[var(--text-muted)]" />
            </Link>
          ))}
        </nav>
      </div>
    </DashboardShell>
  );
}
