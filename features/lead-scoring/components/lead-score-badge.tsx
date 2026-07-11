"use client";

import { cn } from "@/lib/utils";
import {
  LEAD_SCORE_TOOLTIP,
  type LeadScoreBand,
} from "@/features/lead-scoring/types/lead-scoring-types";
import { resolveLeadScoreBand } from "@/features/lead-scoring/services/lead-score-engine";

const bandStyles: Record<
  LeadScoreBand,
  { badge: string; dot: string; text: string }
> = {
  cold: {
    badge: "border-[#CBD5E1]/70 bg-[#F8FAFC] text-[#64748B]",
    dot: "bg-[#94A3B8]",
    text: "text-[#64748B]",
  },
  warm: {
    badge: "border-[#FDE68A]/70 bg-[#FFFBEB] text-[#B45309]",
    dot: "bg-[#F59E0B]",
    text: "text-[#B45309]",
  },
  hot: {
    badge: "border-[#A7F3D0]/70 bg-[#ECFDF5] text-[#047857]",
    dot: "bg-[#10B981]",
    text: "text-[#047857]",
  },
};

type LeadScoreBadgeProps = {
  score: number;
  className?: string;
  showTooltip?: boolean;
};

export function LeadScoreBadge({
  score,
  className,
  showTooltip = true,
}: LeadScoreBadgeProps) {
  const band = resolveLeadScoreBand(score);
  const styles = bandStyles[band];

  return (
    <span
      title={showTooltip ? LEAD_SCORE_TOOLTIP : undefined}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums",
        styles.badge,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", styles.dot)} />
      {score}
    </span>
  );
}

export function getLeadScoreBandStyles(band: LeadScoreBand) {
  return bandStyles[band];
}
