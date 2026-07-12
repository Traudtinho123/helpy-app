"use client";

import { useActiveSkill } from "@/components/user-menu/active-skill-context";
import {
  HELPY_SKILLS,
  SKILL_EMOJI,
  type HelpySkill,
} from "@/features/workspace/services/workspace/skills";
import { cn } from "@/lib/utils";

const PREVIEW_SKILLS: HelpySkill[] = [
  "real-estate",
  "construction",
  "consulting-legal",
];

const COMING_SOON = [
  { id: "friseur", label: "HELPY Friseur", emoji: "💇" },
  { id: "health", label: "HELPY Health", emoji: "🏥" },
] as const;

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

  return (
    <div className="px-3 py-2.5">
      <p className="mb-2 px-1 text-[10px] font-semibold tracking-[0.08em] text-[#94A3B8] uppercase">
        HELPY Vorschau
      </p>
      <ul className="space-y-1">
        {PREVIEW_SKILLS.map((skill) => {
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
                    setActiveSkill(skill);
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
                  {SKILL_EMOJI[skill]} {HELPY_SKILLS[skill].label}
                  {isOwn ? " (dein Skill)" : ""}
                </span>
              </button>
            </li>
          );
        })}
        {COMING_SOON.map((item) => (
          <li key={item.id}>
            <div className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-[12px] text-[#94A3B8]">
              <span>○</span>
              <span>
                {item.emoji} {item.label} (Coming Soon)
              </span>
            </div>
          </li>
        ))}
      </ul>
      {isPreviewMode ? (
        <p className="mt-2 px-1 text-[10px] leading-relaxed text-[#64748B]">
          Vorschau-Modus — deine Daten bleiben {HELPY_SKILLS[profileSkill].label}.
        </p>
      ) : null}
    </div>
  );
}
