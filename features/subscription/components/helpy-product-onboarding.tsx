"use client";

import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  confirmActiveSkill,
  getActivePaidSkill,
  getCompanySubscription,
  isSkillAllowed,
} from "@/features/subscription/services/subscription-service";
import {
  HELPY_SKILLS,
  SKILL_EMOJI,
  HELPY_SKILL_ORDER,
} from "@/features/workspace/services/workspace/skills";
import type { HelpySkill } from "@/features/workspace/services/workspace/skills";
import { cn } from "@/lib/utils";

type HelpyProductOnboardingProps = {
  onConfirmed?: () => void;
};

function getSkillStatusLabel(skill: HelpySkill): string {
  if (isSkillAllowed(skill)) return "Aktiviert";
  return "Nicht in deinem Paket enthalten";
}

export function HelpyProductOnboarding({ onConfirmed }: HelpyProductOnboardingProps) {
  const subscription = useMemo(() => getCompanySubscription(), []);
  const activePaidSkill = getActivePaidSkill();
  const activeConfig = HELPY_SKILLS[activePaidSkill];

  const handleConfirm = useCallback(() => {
    confirmActiveSkill();
    onConfirmed?.();
  }, [onConfirmed]);

  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="helpy-product-onboarding-title"
        className="w-full max-w-lg overflow-hidden rounded-[24px] border border-[#CBD5E1]/50 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
      >
        <div className="border-b border-[#CBD5E1]/40 px-6 py-5">
          <h2
            id="helpy-product-onboarding-title"
            className="text-[16px] font-semibold tracking-[-0.01em] text-[#0F172A]"
          >
            Wähle dein HELPY Produkt
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#64748B]">
            Dein Paket ist mit genau einem HELPY-Produkt verbunden.
          </p>
        </div>

        <div className="space-y-3 px-6 py-5">
          {HELPY_SKILL_ORDER.map((skill) => {
            const allowed = isSkillAllowed(skill);
            const isActive = skill === activePaidSkill;

            return (
              <div
                key={skill}
                className={cn(
                  "rounded-[16px] border px-4 py-3.5 transition-colors",
                  allowed
                    ? "border-[#BFDBFE]/70 bg-[#EFF6FF]/50"
                    : "border-[#E2E8F0]/70 bg-[#F8FAFC]/60 opacity-75"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-[#0F172A]">
                      {SKILL_EMOJI[skill]} {HELPY_SKILLS[skill].label}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-[11px] font-medium",
                        allowed ? "text-[#047857]" : "text-[#64748B]"
                      )}
                    >
                      Status: {getSkillStatusLabel(skill)}
                    </p>
                  </div>
                  {isActive && allowed && (
                    <span className="shrink-0 rounded-full border border-[#A7F3D0]/60 bg-[#ECFDF5]/70 px-2 py-0.5 text-[10px] font-semibold text-[#047857]">
                      Dein Paket
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-[#CBD5E1]/40 bg-[#F8FAFC]/80 px-6 py-4">
          <p className="mb-3 text-[11px] text-[#64748B]">
            Tarif: {subscription.planName}
          </p>
          <Button
            type="button"
            onClick={handleConfirm}
            className="h-10 w-full rounded-[12px] bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-[13px] font-semibold text-white shadow-sm"
          >
            Mit {activeConfig.label} fortfahren
          </Button>
        </div>
      </div>
    </div>
  );
}
