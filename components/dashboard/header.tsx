"use client";

import { GmailSyncStatus } from "@/components/dashboard/gmail-sync-status";
import { UserMenu } from "@/components/user-menu/UserMenu";
import { useActiveSkill } from "@/components/user-menu/active-skill-context";
import { HelpyNotificationBell } from "@/features/notifications/components/HelpyNotificationBell";
import { GlobalSearch } from "@/features/search/components/global-search";
import { Badge } from "@/components/ui/badge";
import { getSkillConfig } from "@/features/workspace/services/workspace/skills";

export function DashboardHeader() {
  const { isPreviewMode, activeSkill } = useActiveSkill();

  return (
    <header className="relative z-30 flex h-[4.75rem] shrink-0 items-center justify-between gap-6 border-b border-white/40 bg-[rgba(255,255,255,0.55)] px-8 backdrop-blur-[20px] [-webkit-backdrop-filter:blur(20px)]">
      <GlobalSearch />

      <div className="flex items-center gap-4">
        {isPreviewMode ? (
          <Badge className="h-8 rounded-[8px] border border-amber-300 bg-amber-50 px-4 text-xs font-semibold tracking-[-0.01em] text-amber-900">
            VORSCHAU: {getSkillConfig(activeSkill).label.replace("HELPY ", "")}
          </Badge>
        ) : null}

        <GmailSyncStatus />

        <Badge className="helpy-btn-primary h-8 rounded-[8px] border-0 px-4 text-xs font-semibold tracking-[-0.01em]">
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
