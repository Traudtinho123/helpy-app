"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { NavBrandIcon } from "@/components/dashboard/nav-brand-icon";
import { useActiveSkill } from "@/components/user-menu/active-skill-context";
import { SlideUpSheet } from "@/components/mobile/slide-up-sheet";
import {
  getStableActiveOpenMailCasesCountSnapshot,
  subscribeMailSummary,
} from "@/features/mail";
import {
  buildMobileMoreNavItems,
  buildMobileTabItems,
  resolveMobileActiveTab,
  type MobileTabId,
} from "@/lib/navigation/mobile-navigation";
import { useExternalStore } from "@/lib/hooks/use-external-store";
import { cn } from "@/lib/utils";

type MobileBottomNavProps = {
  activeHref?: string;
};

export function MobileBottomNav({ activeHref }: MobileBottomNavProps) {
  const pathname = usePathname() ?? "/";
  const { activeSkill } = useActiveSkill();
  const tabs = useMemo(() => buildMobileTabItems(activeSkill), [activeSkill]);
  const moreItems = useMemo(() => buildMobileMoreNavItems(activeSkill), [activeSkill]);
  const [moreOpen, setMoreOpen] = useState(false);

  const activeTab = useMemo(() => {
    if (activeHref) {
      return resolveMobileActiveTab(activeHref, tabs);
    }
    return resolveMobileActiveTab(pathname, tabs);
  }, [activeHref, pathname, tabs]);

  useEffect(() => {
    if (activeTab !== "mehr") {
      setMoreOpen(false);
    }
  }, [activeTab, pathname]);

  const openMailCount = useExternalStore(
    subscribeMailSummary,
    getStableActiveOpenMailCasesCountSnapshot,
    () => 0
  );

  const handleTabClick = (tabId: MobileTabId) => {
    if (tabId === "mehr") {
      setMoreOpen(true);
    }
  };

  return (
    <>
      <nav
        className="helpy-layout-mobile-nav fixed inset-x-0 bottom-0 z-[100] border-t border-[var(--border-strong)] bg-[var(--sidebar-bg)]/95 shadow-[0_-4px_24px_rgba(0,0,0,0.35)] backdrop-blur-[16px] lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Hauptnavigation"
      >
        <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const showBadge =
              tab.showMailBadge && openMailCount > 0 && tab.id === "vorgaenge";

            if (tab.id === "mehr") {
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick("mehr")}
                  className={cn(
                    "relative flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[12px] px-1 text-[10px] font-semibold transition-colors",
                    isActive || moreOpen
                      ? "text-[var(--accent)]"
                      : "text-[var(--text-muted)]"
                  )}
                  aria-label="Mehr"
                  aria-expanded={moreOpen}
                >
                  <span className="text-[18px] leading-none">{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={tab.id}
                href={tab.href ?? "/"}
                className={cn(
                  "relative flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[12px] px-1 text-[10px] font-semibold transition-colors",
                  isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                )}
              >
                <span className="relative text-[18px] leading-none">
                  {tab.emoji}
                  {showBadge ? (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-white">
                      {openMailCount > 9 ? "9+" : openMailCount}
                    </span>
                  ) : null}
                </span>
                <span className="truncate">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <SlideUpSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="Mehr">
        <div className="grid gap-1 p-4 pb-8">
          {moreItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              className="flex min-h-[48px] items-center gap-3 rounded-xl px-4 text-[15px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)] active:bg-[var(--accent-light)]"
            >
              <span className="flex size-6 items-center justify-center text-xl">
                {item.brandIcon ? (
                  <NavBrandIcon brand={item.brandIcon} className="size-5" />
                ) : (
                  item.emoji
                )}
              </span>
              {item.label}
            </Link>
          ))}
        </div>
      </SlideUpSheet>
    </>
  );
}
