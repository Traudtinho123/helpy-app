"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { HelpyCharacter } from "@/components/helpy/helpy-character";
import { NavBrandIcon } from "@/components/dashboard/nav-brand-icon";
import { SidebarUserFooter } from "@/components/dashboard/sidebar-user-footer";
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
        "group relative mx-2 flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13px] font-medium transition-all duration-150",
        isActive
          ? "border-l-2 border-l-[var(--accent)] bg-[var(--accent-light)] pl-[calc(0.75rem-2px)] font-semibold text-[var(--text-accent)]"
          : "text-[var(--text-sidebar-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center text-[15px]">
        {item.brandIcon ? (
          <NavBrandIcon brand={item.brandIcon} />
        ) : (
          item.emoji
        )}
      </span>
      <span className="flex-1 truncate">{item.label}</span>
      {count !== undefined ? (
        <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[10px] font-bold tabular-nums text-white">
          {count > 99 ? "99+" : count}
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
    <aside
      className="helpy-layout-sidebar relative z-10 hidden h-screen shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)] lg:flex"
      style={{ width: "var(--sidebar-width)" }}
    >
      <div className="flex shrink-0 items-center gap-3 px-5 pt-6 pb-5">
        <HelpyCharacter size={40} pose="wave" animated={false} />
        <div className="min-w-0">
          <p className="helpy-display text-[18px] font-semibold leading-none text-[var(--text-primary)]">
            HELPY
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">Office KI</p>
        </div>
      </div>

      <div className="mx-5 h-px bg-[var(--border)]" />

      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto py-2">
        {CORE_NAV_GROUPS.map((group) => {
          const groupItems = primaryItems.filter(
            (item) => item.navGroup === group.id
          );
          if (groupItems.length === 0) return null;

          return (
            <section key={group.id}>
              <p className="px-4 pt-5 pb-1.5 text-[9px] font-bold tracking-[0.15em] text-[var(--text-muted)] uppercase">
                {group.label}
              </p>
              <div className="space-y-0.5">{groupItems.map(renderNavItem)}</div>
            </section>
          );
        })}

        <section className="mt-4">
          <div className="mx-5 mb-2 h-px bg-[var(--border)]" />
          <div className="space-y-0.5">{settingsItems.map(renderNavItem)}</div>
        </section>
      </nav>

      <div className="shrink-0 border-t border-[var(--border)]">
        <SidebarUserFooter />
      </div>
    </aside>
  );
}
