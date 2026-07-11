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
        "group flex items-center gap-2.5 rounded-[10px] px-2.5 py-[7px] text-[13px] font-medium transition-colors duration-200",
        isActive
          ? "bg-white/[0.12] text-white shadow-sm ring-1 ring-white/[0.08]"
          : "text-slate-300/90 hover:bg-white/[0.06] hover:text-white"
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-[8px] text-[14px] transition-colors",
          isActive ? "bg-white/[0.1]" : "bg-transparent"
        )}
      >
        {item.emoji}
      </span>
      <span className="flex-1 truncate tracking-[-0.01em]">{item.label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
            isActive
              ? "bg-[#3B82F6] text-white"
              : "bg-white/10 text-slate-300"
          )}
        >
          {count}
        </span>
      )}
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
    <aside className="relative z-10 flex h-screen w-[248px] shrink-0 flex-col border-r border-black/20 bg-[#1C1C1E] shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)]">
      <div className="flex h-[3.75rem] shrink-0 items-center px-5">
        <HelpyLogo size="md" variant="light" />
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pt-1 pb-2">
        {CORE_NAV_GROUPS.map((group) => {
          const groupItems = primaryItems.filter(
            (item) => item.navGroup === group.id
          );
          if (groupItems.length === 0) return null;

          return (
            <section key={group.id}>
              <p className="mb-1.5 px-2.5 text-[11px] font-semibold tracking-[-0.01em] text-slate-500">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {groupItems.map(renderNavItem)}
              </div>
            </section>
          );
        })}

        <section className="mt-auto pt-2">
          <p className="mb-1.5 px-2.5 text-[11px] font-semibold tracking-[-0.01em] text-slate-500">
            System
          </p>
          <div className="space-y-0.5">{settingsItems.map(renderNavItem)}</div>
        </section>
      </nav>

      <SidebarSkillStatus />
      <DataPrivacySidebarHint />
    </aside>
  );
}
