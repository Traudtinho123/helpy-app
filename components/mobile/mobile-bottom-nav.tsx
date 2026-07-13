"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E2E8F0]/80 bg-[rgba(255,255,255,0.92)] backdrop-blur-[16px] lg:hidden"
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
                      ? "text-[var(--primary)]"
                      : "text-[#64748B]"
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
                  isActive ? "text-[var(--primary)]" : "text-[#64748B]"
                )}
              >
                <span className="relative text-[18px] leading-none">
                  {tab.emoji}
                  {showBadge ? (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[9px] font-bold text-white">
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
              className="flex min-h-[48px] items-center gap-3 rounded-[14px] px-4 text-[15px] font-medium text-[#0F172A] transition-colors hover:bg-[#F8FAFC] active:bg-[#EFF6FF]"
            >
              <span className="text-xl">{item.emoji}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </SlideUpSheet>
    </>
  );
}
