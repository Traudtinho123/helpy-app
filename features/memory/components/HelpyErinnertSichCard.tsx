"use client";

import { Sparkles } from "lucide-react";
import type { BackgroundMemoryHint } from "@/features/memory/types/memory-types";

type HelpyErinnertSichCardProps = {
  hints: readonly BackgroundMemoryHint[];
};

export function HelpyErinnertSichCard({ hints }: HelpyErinnertSichCardProps) {
  if (hints.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      {hints.map((hint) => (
        <div
          key={hint.id}
          className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3.5"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-[var(--text-secondary)]" strokeWidth={2} />
            <p className="text-[11px] font-semibold text-[var(--text-secondary)]">
              HELPY erinnert sich
            </p>
          </div>
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            {hint.rememberText}
          </p>
          {hint.tipText && (
            <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--text-secondary)]">
              {hint.tipText}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
