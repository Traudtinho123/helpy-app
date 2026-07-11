"use client";

import { cn } from "@/lib/utils";
import { LEAD_SCORE_TOOLTIP } from "@/features/lead-scoring/types/lead-scoring-types";
import { resolveLeadScoreBand } from "@/features/lead-scoring/services/lead-score-engine";
import { getLeadScoreBandStyles } from "@/features/lead-scoring/components/lead-score-badge";

type LeadScoreIndicatorProps = {
  score: number;
  className?: string;
};

export function LeadScoreIndicator({ score, className }: LeadScoreIndicatorProps) {
  const band = resolveLeadScoreBand(score);
  const styles = getLeadScoreBandStyles(band);

  return (
    <div
      title={LEAD_SCORE_TOOLTIP}
      className={cn(
        "inline-flex items-center gap-2 rounded-[14px] border px-3 py-1.5",
        styles.badge,
        className
      )}
    >
      <span className={cn("size-2.5 rounded-full", styles.dot)} />
      <span className="text-[11px] font-semibold uppercase tracking-[0.04em]">
        Lead-Score
      </span>
      <span className={cn("text-[18px] font-bold leading-none tabular-nums", styles.text)}>
        {score}
      </span>
      <span className="text-[10px] font-medium opacity-80">/10</span>
    </div>
  );
}
