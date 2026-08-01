"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { NavBrandIcon } from "@/components/dashboard/nav-brand-icon";
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
import {
  getOpenDealCountSnapshot,
  fetchDeals,
  subscribeDeals,
} from "@/features/deals/services/deal-client-store";
import { cn } from "@/lib/utils";
import { useExternalStore } from "@/lib/hooks/use-external-store";

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
        "group relative flex items-center gap-[var(--space-3)] rounded-[var(--radius-md)] px-3 py-2 text-[var(--text-sm)] font-medium transition-[color,background] duration-[var(--transition-fast)]",
        isActive
          ? "border-l-2 border-l-[var(--color-primary)] bg-[var(--sidebar-active)] pl-[calc(0.75rem-2px)] text-white"
          : "text-[var(--text-sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[rgba(255,255,255,0.8)]"
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center text-[15px] transition-colors duration-[var(--transition-fast)]",
          isActive ? "text-[var(--color-primary-mid)]" : "text-[var(--text-sidebar-muted)] group-hover:text-[rgba(255,255,255,0.8)]"
        )}
      >
        {item.brandIcon ? (
          <NavBrandIcon brand={item.brandIcon} />
        ) : (
          item.emoji
        )}
      </span>
      <span className="flex-1 truncate">{item.label}</span>
      {count !== undefined ? (
        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-primary)] px-1.5 text-[10px] font-semibold tabular-nums text-white">
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

  const openDealCount = useExternalStore(
    subscribeDeals,
    getOpenDealCountSnapshot,
    () => 0
  );

  useEffect(() => {
    void fetchDeals({ openOnly: true });
    return startWhatsappSummaryPolling();
  }, []);

  const renderNavItem = (item: CoreNavItem) => {
    const isActive = resolvedActiveHref === item.href;
    const count =
      item.showMailCount && openMailCasesCount > 0
        ? openMailCasesCount
        : item.showWhatsappCount && openWhatsappCount > 0
          ? openWhatsappCount
          : item.showDealCount && openDealCount > 0
            ? openDealCount
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
    <aside className="helpy-layout-sidebar relative z-10 hidden h-screen w-[240px] shrink-0 flex-col bg-[var(--sidebar-bg)] shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)] lg:flex">
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
              <p className="mb-[var(--space-2)] px-3 pt-[var(--space-5)] text-[9px] font-bold tracking-[0.12em] text-[rgba(255,255,255,0.2)] uppercase">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {groupItems.map(renderNavItem)}
              </div>
            </section>
          );
        })}

        <section className="mt-auto pt-2">
          <p className="mb-[var(--space-2)] px-3 pt-[var(--space-5)] text-[9px] font-bold tracking-[0.12em] text-[rgba(255,255,255,0.2)] uppercase">
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
