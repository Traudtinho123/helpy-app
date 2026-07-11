"use client";

import { GmailSyncStatus } from "@/components/dashboard/gmail-sync-status";
import { UserMenu } from "@/components/user-menu/UserMenu";
import { HelpyNotificationBell } from "@/features/notifications/components/HelpyNotificationBell";
import { GlobalSearch } from "@/features/search/components/global-search";
import { Badge } from "@/components/ui/badge";

export function DashboardHeader() {
  return (
    <header className="relative z-30 flex h-[4.75rem] shrink-0 items-center justify-between gap-6 border-b border-[#CBD5E1]/50 bg-white/75 px-8 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] backdrop-blur-2xl">
      <GlobalSearch />

      <div className="flex items-center gap-4">
        <GmailSyncStatus />

        <Badge className="h-8 rounded-full border-0 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] px-4 text-xs font-semibold tracking-[-0.01em] text-white shadow-[0_4px_16px_rgba(37,99,235,0.35)]">
          Pro-Tarif
        </Badge>

        <div className="flex items-center gap-2.5">
          <HelpyNotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
