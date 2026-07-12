"use client";

import { useActiveSkill } from "@/components/user-menu/active-skill-context";
import {
  SUPER_ADMIN_SKILLS,
  type IndustrySkillId,
} from "@/features/workspace/services/skills/all-skills";
import {
  getSkillConfig,
  type HelpySkill,
} from "@/features/workspace/services/workspace/skills";
import { cn } from "@/lib/utils";

export function SkillSwitcher() {
  const {
    activeSkill,
    profileSkill,
    canSwitchSkill,
    setActiveSkill,
    clearPreviewSkill,
    isPreviewMode,
  } = useActiveSkill();

  if (!canSwitchSkill) {
    const config = getSkillConfig(activeSkill);
    return (
      <div className="px-3 py-2.5">
        <p className="mb-2 px-1 text-[10px] font-semibold tracking-[0.08em] text-[#94A3B8] uppercase">
          Aktiver HELPY
        </p>
        <div className="rounded-[12px] border border-[#E2E8F0]/80 bg-[#F8FAFC]/80 px-3 py-2.5">
          <p className="text-[13px] font-semibold tracking-[-0.01em] text-[#0F172A]">
            {config.emoji} {config.label}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-[#64748B]">
            Dieser HELPY ist mit deinem Paket verbunden.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-2.5">
      <p className="mb-2 px-1 text-[10px] font-semibold tracking-[0.08em] text-[#94A3B8] uppercase">
        HELPY Vorschau
      </p>
      <ul className="max-h-[280px] space-y-1 overflow-y-auto">
        {SUPER_ADMIN_SKILLS.map((skill: IndustrySkillId) => {
          const config = getSkillConfig(skill);
          const isActive = activeSkill === skill;
          const isOwn = profileSkill === skill;

          return (
            <li key={skill}>
              <button
                type="button"
                onClick={() => {
                  if (skill === profileSkill) {
                    clearPreviewSkill();
                  } else {
                    setActiveSkill(skill as HelpySkill);
                  }
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-left text-[12px] font-medium transition-colors",
                  isActive
                    ? "bg-[#EFF6FF] text-[#2563EB]"
                    : "text-[#334155] hover:bg-[#F8FAFC]"
                )}
              >
                <span>{isActive ? "●" : "○"}</span>
                <span>
                  {config.emoji} {config.label.replace("HELPY ", "")}
                  {isOwn ? " (dein Skill)" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {isPreviewMode ? (
        <p className="mt-2 px-1 text-[10px] leading-relaxed text-[#64748B]">
          Vorschau-Modus — deine Daten bleiben {getSkillConfig(profileSkill).label}.
        </p>
      ) : null}
    </div>
  );
}
