"use client";

import { memo } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { ActionButton } from "@/components/helpy/ActionButton";
import type { HelpyActionExecutionState } from "@/features/brain/services/helpy-actions";
import type { ResolvedHelpyAction } from "@/features/brain/services/helpy-actions/resolve-action-execution";
import { cn } from "@/lib/utils";

type RecommendationCardProps = {
  action: ResolvedHelpyAction;
  status: HelpyActionExecutionState;
  onExecute: (action: ResolvedHelpyAction) => void;
  className?: string;
};

export const RecommendationCard = memo(function RecommendationCard({
  action,
  status,
  onExecute,
  className,
}: RecommendationCardProps) {
  const isPreparing = status === "preparing";
  const isDone = status === "done";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[18px] border bg-[var(--bg-surface)] p-4 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-all duration-500",
        isDone
          ? "border-[#A7F3D0]/70 bg-[#ECFDF5]/50"
          : "border-[var(--border)]/55 hover:border-[#2563EB]/25 hover:bg-[var(--bg-elevated)]/85 hover:shadow-[0_8px_32px_rgba(37,99,235,0.1)]",
        isPreparing && "helpy-action-preparing border-[var(--border-accent)]/70",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-[#EFF6FF]/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-start gap-3.5">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-[14px] text-[20px] shadow-[0_4px_12px_rgba(15,23,42,0.08)] transition-all duration-500",
            isDone
              ? "bg-[#DCFCE7] ring-1 ring-[#A7F3D0]/80"
              : "bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]/80 ring-1 ring-[#BFDBFE]/60 group-hover:scale-105"
          )}
        >
          {isDone ? (
            <CheckCircle2 className="size-5 text-[#047857]" strokeWidth={2.25} />
          ) : (
            <span className="leading-none">{action.icon}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[13px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              {action.title}
            </h3>
            {!isDone && (
              <span className="shrink-0 rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                {action.benefit}
              </span>
            )}
          </div>

          {isPreparing ? (
            <div className="helpy-fade-in mt-3 rounded-[12px] border border-[var(--border-accent)] bg-[var(--accent-light)] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Sparkles
                  className="size-3.5 animate-pulse text-[var(--accent)]"
                  strokeWidth={2.25}
                />
                <p className="text-[12px] font-medium text-[var(--accent)]">
                  Ich bereite den nächsten Schritt vor…
                </p>
              </div>
              <div className="helpy-action-progress mt-2.5 h-1 overflow-hidden rounded-full bg-[#DBEAFE]/80">
                <div className="helpy-action-progress-bar h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA]" />
              </div>
            </div>
          ) : isDone ? (
            <p className="helpy-fade-in mt-2 text-[12px] font-medium text-[#047857]">
              Bestätigt — {action.title} ist vorbereitet.
            </p>
          ) : (
            <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--text-secondary)]">
              {action.description}
            </p>
          )}

          {!isDone && (
            <div className="mt-3.5 space-y-2">
              <ActionButton
                label={action.primaryLabel}
                loading={isPreparing}
                completed={isDone}
                disabled={action.disabled || isPreparing}
                disabledReason={action.disabledReason}
                onClick={() => onExecute(action)}
              />
              {action.disabled && action.disabledReason ? (
                <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">
                  {action.disabledReason}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </article>
  );
});
