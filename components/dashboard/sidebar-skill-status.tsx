"use client";

import { useCompanyProfile } from "@/components/company/company-profile-context";
import { getSkillMonitorConfig } from "@/features/workspace/services/workspace/skills";

export function SidebarSkillStatus() {
  const { profile: company } = useCompanyProfile();
  const monitor = getSkillMonitorConfig(company.activePaidSkill);

  return (
    <div className="relative shrink-0 px-3 py-3">
      <div className="flex items-center gap-3 rounded-[14px] bg-[var(--sidebar-hover)] px-3 py-2.5 ring-1 ring-white/[0.04]">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--sidebar-active)] text-base">
          {monitor.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-[0.08em] text-[var(--text-sidebar-muted)] uppercase">
            Aktiver HELPY
          </p>
          <p className="truncate text-[13px] font-semibold tracking-[-0.02em] text-[var(--text-sidebar)]">
            {monitor.label.replace(/^HELPY\s/, "")}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--success)]/10 px-2 py-0.5 ring-1 ring-[var(--success)]/25">
          <span className="helpy-pulse-dot size-1.5 rounded-full bg-[var(--success)]" />
          <span className="text-[10px] font-semibold text-[var(--success)]">Aktiv</span>
        </span>
      </div>
    </div>
  );
}
