"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useWorkspaceContext } from "@/features/workspace/context";
import { buildWorkspaceSummaryFromContext } from "@/features/workspace/services/gmail-workspace/workspace-summary";
import { cn } from "@/lib/utils";

type HelpyWorkspaceSummaryProps = {
  className?: string;
};

export function HelpyWorkspaceSummary({ className }: HelpyWorkspaceSummaryProps) {
  const context = useWorkspaceContext();

  const lines = useMemo(
    () => buildWorkspaceSummaryFromContext(context),
    [context]
  );

  if (lines.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-[12px] border border-[var(--border-accent)]/50 bg-[var(--accent-light)] px-3.5 py-3",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[var(--accent)]" strokeWidth={2} />
        <div className="min-w-0 space-y-1">
          <p className="text-[10px] font-semibold tracking-[0.04em] text-[var(--accent)] uppercase">
            HELPY Übersicht
          </p>
          {lines.map((line, index) => (
            <p key={`${index}-${line}`} className="text-[12px] leading-snug text-[var(--text-secondary)]">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
