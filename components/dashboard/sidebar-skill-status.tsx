"use client";

import { useCompanyProfile } from "@/components/company/company-profile-context";
import { getSkillMonitorConfig } from "@/features/workspace/services/workspace/skills";

export function SidebarSkillStatus() {
  const { profile: company } = useCompanyProfile();
  const monitor = getSkillMonitorConfig(company.activePaidSkill);

  return (
    <div className="relative shrink-0 border-t border-white/[0.06] px-3 py-3">
      <div className="flex items-center gap-3 rounded-[14px] bg-white/[0.05] px-3 py-2.5 ring-1 ring-white/[0.06] backdrop-blur-sm">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.08] text-base">
          {monitor.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium tracking-[0.06em] text-slate-400 uppercase">
            Aktiver HELPY
          </p>
          <p className="truncate text-[12px] font-semibold tracking-[-0.01em] text-white">
            {monitor.label.replace(/^HELPY\s/, "")}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#34D399]/10 px-2 py-0.5 ring-1 ring-[#34D399]/25">
          <span className="size-1.5 rounded-full bg-[#34D399]" />
          <span className="text-[10px] font-semibold text-[#6EE7B7]">Aktiv</span>
        </span>
      </div>
    </div>
  );
}
