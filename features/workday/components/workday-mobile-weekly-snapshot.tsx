"use client";

import { BarChart3, TrendingDown, TrendingUp } from "lucide-react";
import type {
  WorkdayAnalytics,
  WorkdayKpiMetric,
} from "@/features/analytics/services/workday-analytics";
import { cn } from "@/lib/utils";

type WorkdayMobileWeeklySnapshotProps = {
  analytics: WorkdayAnalytics | null;
  extraKpis?: WorkdayKpiMetric[];
  isLoading?: boolean;
  onOpenDetails: () => void;
};

function formatTrend(metric: WorkdayKpiMetric): string {
  if (metric.trend === "flat" || metric.changePercent === 0) return "—";
  const sign = metric.trend === "up" ? "+" : "";
  return `${sign}${metric.changePercent}%`;
}

function TrendIcon({ metric }: { metric: WorkdayKpiMetric }) {
  if (metric.trend === "up") {
    return <TrendingUp className="size-3.5 text-[#047857]" />;
  }
  if (metric.trend === "down") {
    return <TrendingDown className="size-3.5 text-[#DC2626]" />;
  }
  return <span className="text-[12px] text-[var(--text-muted)]">✓</span>;
}

export function WorkdayMobileWeeklySnapshot({
  analytics,
  extraKpis = [],
  isLoading = false,
  onOpenDetails,
}: WorkdayMobileWeeklySnapshotProps) {
  if (isLoading) {
    return (
      <div className="mobile-snapshot animate-pulse rounded-[16px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 md:hidden">
        <div className="h-5 w-32 rounded bg-[var(--background-secondary)]" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-4 rounded bg-[var(--background-secondary)]" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const metrics = [
    ...analytics.kpis.filter(
      (metric) => !extraKpis.some((extra) => extra.id === metric.id)
    ),
    ...extraKpis,
  ].slice(0, 4);

  if (metrics.length === 0) return null;

  return (
    <div className="mobile-snapshot rounded-[16px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm md:hidden">
      <div className="flex items-center gap-2">
        <BarChart3 className="size-4 text-[var(--primary)]" />
        <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Diese Woche</h2>
      </div>

      <div className="my-3 border-t border-[var(--border)]" />

      <ul className="space-y-2.5">
        {metrics.map((metric) => (
          <li
            key={metric.id}
            className="flex items-center justify-between gap-3 text-[13px]"
          >
            <span className="text-[var(--text-secondary)]">{metric.label}</span>
            <span className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
              <span className="tabular-nums">{metric.current}</span>
              <span
                className={cn(
                  "flex items-center gap-0.5 text-[11px] font-medium",
                  metric.trend === "up" && "text-[#047857]",
                  metric.trend === "down" && "text-[#DC2626]",
                  metric.trend === "flat" && "text-[var(--text-muted)]"
                )}
              >
                <TrendIcon metric={metric} />
                {formatTrend(metric)}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <div className="my-3 border-t border-[var(--border)]" />

      <button
        type="button"
        onClick={onOpenDetails}
        className="w-full min-h-[44px] rounded-[12px] bg-[var(--accent-light)] text-[13px] font-semibold text-[var(--accent)]"
      >
        Vollständige Analyse →
      </button>
    </div>
  );
}
