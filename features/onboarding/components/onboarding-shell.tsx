"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ONBOARDING_TOTAL_STEPS } from "@/lib/onboarding/constants";
import { cn } from "@/lib/utils";

type OnboardingShellProps = {
  step: number;
  children: ReactNode;
  onBack?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  footer?: ReactNode;
};

export function OnboardingShell({
  step,
  children,
  onBack,
  onSkip,
  showSkip = false,
  footer,
}: OnboardingShellProps) {
  const progress = (step / ONBOARDING_TOTAL_STEPS) * 100;

  return (
    <div className="onboarding-page min-h-[100dvh] bg-[#F7F6F2] text-[#1E1B4B]">
      <div className="fixed inset-x-0 top-0 z-50 h-[3px] bg-[#E7E5E4]">
        <div
          className="h-full bg-[#4F46E5] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 pb-2 pt-6 sm:px-6">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[13px] font-medium text-[#64748B] transition-colors hover:bg-white/60 hover:text-[#1E1B4B]"
          >
            <ChevronLeft className="size-4" />
            Zurück
          </button>
        ) : (
          <span />
        )}
        {showSkip && onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="text-[13px] font-medium text-[#64748B] transition-colors hover:text-[#4F46E5]"
          >
            Überspringen
          </button>
        ) : (
          <span className="text-[12px] font-medium text-[#94A3B8]">
            Schritt {step} von {ONBOARDING_TOTAL_STEPS}
          </span>
        )}
      </header>

      <main className="onboarding-main mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-28 pt-4 sm:px-6 sm:pb-10">
        <div className="onboarding-step-enter flex flex-1 flex-col">{children}</div>
      </main>

      {footer ? (
        <div className="onboarding-footer fixed inset-x-0 bottom-0 border-t border-[#E7E5E4]/80 bg-[#F7F6F2]/95 px-4 py-4 backdrop-blur-md sm:static sm:mx-auto sm:max-w-2xl sm:border-0 sm:bg-transparent sm:px-6 sm:py-6 sm:backdrop-blur-none">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function OnboardingPrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-12 w-full rounded-[14px] bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(79,70,229,0.28)] transition-transform active:scale-[0.99] disabled:opacity-50"
      )}
    >
      {children}
    </button>
  );
}

export function OnboardingHeadline({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "onboarding-display text-center text-[2rem] font-semibold leading-[1.15] tracking-[-0.02em] text-[#1E1B4B] sm:text-[3rem]",
        className
      )}
    >
      {children}
    </h1>
  );
}

export function OnboardingSubtext({ children }: { children: ReactNode }) {
  return (
    <p className="mx-auto mt-4 max-w-lg text-center text-[15px] leading-relaxed text-[#64748B] sm:text-[16px]">
      {children}
    </p>
  );
}

export function OnboardingField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[13px] font-medium text-[#475569]">{label}</span>
      {children}
    </label>
  );
}
