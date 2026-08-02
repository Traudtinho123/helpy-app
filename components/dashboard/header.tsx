"use client";

import { UserMenu } from "@/components/user-menu/UserMenu";
import { useActiveSkill } from "@/components/user-menu/active-skill-context";
import { HelpyNotificationBell } from "@/features/notifications/components/HelpyNotificationBell";
import { GlobalSearch } from "@/features/search/components/global-search";
import { Badge } from "@/components/ui/badge";
import { getSkillConfig } from "@/features/workspace/services/workspace/skills";
import { usePathname } from "next/navigation";
import { resolveCoreNavActiveHref } from "@/lib/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/": "Mein Arbeitsplatz",
  "/vorgaenge": "Vorgänge",
  "/objekte": "Objekte",
  "/kunden": "Kunden",
  "/kalender": "Kalender",
  "/finanzen": "Finanzen",
  "/dokumente": "Dokumente",
  "/plattformen": "Plattformen",
  "/social-media": "Social Media",
  "/whatsapp": "WhatsApp",
  "/telefonie": "Helpy-Phone",
  "/einstellungen": "Einstellungen",
};

function resolvePageTitle(pathname: string, skillLabel: string): string {
  const href = resolveCoreNavActiveHref(pathname);
  if (PAGE_TITLES[href]) return PAGE_TITLES[href]!;
  if (pathname.startsWith("/workspace/")) return "Vorgang";
  if (pathname.startsWith("/objekte/")) return "Objekt";
  return skillLabel;
}

export function DashboardHeader() {
  const pathname = usePathname() ?? "/";
  const { isPreviewMode, activeSkill } = useActiveSkill();
  const skillConfig = getSkillConfig(activeSkill);
  const pageTitle = resolvePageTitle(pathname, skillConfig.label);

  return (
    <header className="helpy-layout-desktop-header relative z-30 hidden h-14 shrink-0 items-center justify-between gap-6 border-b border-[var(--border-strong)] bg-[var(--sidebar-bg)] px-6 lg:flex">
      <h1 className="shrink-0 text-[16px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
        {pageTitle}
      </h1>

      <div className="mx-4 min-w-0 flex-1 max-w-md">
        <GlobalSearch />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {isPreviewMode ? (
          <Badge className="h-8 rounded-[8px] border border-[var(--warning)]/30 bg-[var(--warning-light)] px-3 text-xs font-semibold text-[var(--warning)]">
            👁 Vorschau: {skillConfig.label.replace("HELPY ", "")}
          </Badge>
        ) : null}

        <div className="flex items-center gap-2">
          <HelpyNotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
