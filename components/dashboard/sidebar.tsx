"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { SidebarSkillStatus } from "@/components/dashboard/sidebar-skill-status";
import { DataPrivacySidebarHint } from "@/components/privacy/data-privacy-sidebar-hint";
import { HelpyLogo } from "@/components/helpy/helpy-logo";
import { useActiveSkill } from "@/components/user-menu/active-skill-context";
import {
  getStableActiveOpenMailCasesCountSnapshot,
  subscribeMailSummary,
} from "@/features/mail";
import {
  getStableWhatsappOpenCountSnapshot,
  startWhatsappSummaryPolling,
  subscribeWhatsappSummary,
} from "@/features/whatsapp/services/whatsapp-summary-store";
import {
  buildCoreNavItems,
  CORE_NAV_GROUPS,
  resolveCoreNavActiveHref,
  type CoreNavItem,
} from "@/lib/navigation";
import { useExternalStore } from "@/lib/hooks/use-external-store";
import { cn } from "@/lib/utils";

type SidebarProps = {
  activeHref?: string;
};

function NavItem({
  item,
  isActive,
  count,
}: {
  item: CoreNavItem;
  isActive: boolean;
  count?: number;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13px] font-medium transition-all duration-150",
        isActive
          ? "border-l-[3px] border-l-[var(--primary)] bg-[var(--sidebar-active)] pl-[calc(0.75rem-3px)] text-white"
          : "text-[var(--text-sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-sidebar)]"
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-[8px] text-[15px] transition-colors duration-150",
          isActive ? "text-[var(--primary)]" : "text-[var(--text-sidebar-muted)] group-hover:text-[var(--text-sidebar)]"
        )}
      >
        {item.emoji}
      </span>
      <span className="flex-1 truncate tracking-[-0.02em]">{item.label}</span>
      {count !== undefined ? (
        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--primary)] px-1.5 text-[10px] font-semibold tabular-nums text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

export function Sidebar({ activeHref }: SidebarProps) {
  const pathname = usePathname();
  const { activeSkill } = useActiveSkill();
  const navItems = buildCoreNavItems(activeSkill);
  const primaryItems = navItems.filter((item) => item.section === "primary");
  const settingsItems = navItems.filter((item) => item.section === "settings");
  const resolvedActiveHref =
    activeHref ?? resolveCoreNavActiveHref(pathname ?? "/");

  const openMailCasesCount = useExternalStore(
    subscribeMailSummary,
    getStableActiveOpenMailCasesCountSnapshot,
    () => 0
  );

  const openWhatsappCount = useExternalStore(
    subscribeWhatsappSummary,
    getStableWhatsappOpenCountSnapshot,
    () => 0
  );

  useEffect(() => {
    return startWhatsappSummaryPolling();
  }, []);

  const renderNavItem = (item: CoreNavItem) => {
    const isActive = resolvedActiveHref === item.href;
    const count =
      item.showMailCount && openMailCasesCount > 0
        ? openMailCasesCount
        : item.showWhatsappCount && openWhatsappCount > 0
          ? openWhatsappCount
          : undefined;

    return (
      <NavItem
        key={item.href}
        item={item}
        isActive={isActive}
        count={count}
      />
    );
  };

  return (
    <aside className="relative z-10 flex h-screen w-[260px] shrink-0 flex-col bg-[var(--sidebar-bg)] shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)]">
      <div className="flex shrink-0 items-center px-5 pt-6 pb-5">
        <HelpyLogo size="sidebar" variant="light" />
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 pb-2">
        {CORE_NAV_GROUPS.map((group) => {
          const groupItems = primaryItems.filter(
            (item) => item.navGroup === group.id
          );
          if (groupItems.length === 0) return null;

          return (
            <section key={group.id}>
              <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.08em] text-[var(--text-secondary)] uppercase">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {groupItems.map(renderNavItem)}
              </div>
            </section>
          );
        })}

        <section className="mt-auto pt-2">
          <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.08em] text-[var(--text-secondary)] uppercase">
            System
          </p>
          <div className="space-y-0.5">{settingsItems.map(renderNavItem)}</div>
        </section>
      </nav>

      <div className="shrink-0 border-t border-[var(--sidebar-divider)]">
        <SidebarSkillStatus />
        <DataPrivacySidebarHint />
      </div>
    </aside>
  );
}
