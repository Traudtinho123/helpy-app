"use client";

import { ArrowLeft } from "lucide-react";

type MobileBackHeaderProps = {
  title: string;
  onBack: () => void;
  subtitle?: string;
};

export function MobileBackHeader({ title, onBack, subtitle }: MobileBackHeaderProps) {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-surface)] px-3 py-3 lg:hidden">
      <button
        type="button"
        onClick={onBack}
        className="flex size-11 shrink-0 items-center justify-center rounded-[12px] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
        aria-label="Zurück"
      >
        <ArrowLeft className="size-5" />
      </button>
      <div className="min-w-0">
        <h2 className="truncate text-[16px] font-semibold text-[var(--text-primary)]">{title}</h2>
        {subtitle ? (
          <p className="truncate text-[12px] text-[var(--text-secondary)]">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
