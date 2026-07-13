"use client";

import { ArrowLeft } from "lucide-react";

type MobileBackHeaderProps = {
  title: string;
  onBack: () => void;
  subtitle?: string;
};

export function MobileBackHeader({ title, onBack, subtitle }: MobileBackHeaderProps) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-[#E2E8F0]/80 bg-white px-3 py-3 lg:hidden">
      <button
        type="button"
        onClick={onBack}
        className="flex size-11 shrink-0 items-center justify-center rounded-[12px] text-[#0F172A] hover:bg-[#F1F5F9]"
        aria-label="Zurück"
      >
        <ArrowLeft className="size-5" />
      </button>
      <div className="min-w-0">
        <h2 className="truncate text-[16px] font-semibold text-[#0F172A]">{title}</h2>
        {subtitle ? (
          <p className="truncate text-[12px] text-[#64748B]">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
