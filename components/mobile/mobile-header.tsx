"use client";

import { usePathname } from "next/navigation";
import { HelpyLogo } from "@/components/helpy/helpy-logo";
import { HelpyNotificationBell } from "@/features/notifications/components/HelpyNotificationBell";
import { UserMenu } from "@/components/user-menu/UserMenu";
import { resolveMobilePageTitle } from "@/lib/mobile/page-titles";

export function MobileHeader() {
  const pathname = usePathname() ?? "/";
  const pageTitle = resolveMobilePageTitle(pathname);

  return (
    <header
      className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/40 bg-[rgba(255,255,255,0.85)] px-4 backdrop-blur-[16px] lg:hidden"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="min-w-0 shrink-0">
        <HelpyLogo size="sm" variant="dark" showSubtitle={false} />
      </div>

      <h1 className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold tracking-[-0.02em] text-[#0F172A]">
        {pageTitle}
      </h1>

      <div className="flex shrink-0 items-center gap-1">
        <HelpyNotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
