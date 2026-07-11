"use client";

import { useActiveSkill } from "@/components/user-menu/active-skill-context";
import {
  HELPY_SKILLS,
  SKILL_EMOJI,
} from "@/features/workspace/services/workspace/skills";

export function SkillSwitcher() {
  const { activeSkill } = useActiveSkill();

  return (
    <div className="px-3 py-2.5">
      <p className="mb-2 px-1 text-[10px] font-semibold tracking-[0.08em] text-[#94A3B8] uppercase">
        Aktiver HELPY
      </p>

      <div className="rounded-[12px] border border-[#E2E8F0]/80 bg-[#F8FAFC]/80 px-3 py-2.5">
        <p className="text-[13px] font-semibold tracking-[-0.01em] text-[#0F172A]">
          {SKILL_EMOJI[activeSkill]} {HELPY_SKILLS[activeSkill].label}
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-[#64748B]">
          Dieser HELPY ist mit deinem Paket verbunden.
        </p>
      </div>
    </div>
  );
}
